from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaConnectionError
import json
from dotenv import load_dotenv
import os
import asyncio

load_dotenv()

class KafkaProducer:
    def __init__(self, bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS")):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None

    async def start(self, max_retries=10, retry_interval=3):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )

        for attempt in range(1, max_retries + 1):
            try:
                await self.producer.start()
                return
            except KafkaConnectionError as e:
                print(f"Kafka not ready yet ({attempt}/{max_retries}): {e}")
                await asyncio.sleep(retry_interval)

        raise RuntimeError("Failed to connect to Kafka after multiple retries.")

    async def send(self, topic: str, message: dict, headers=None):
        await self.producer.send(topic, value=message, headers=headers)

    async def stop(self):
        if self.producer:
            await self.producer.stop()

# Initialize Kafka producer
kafka_producer = KafkaProducer()