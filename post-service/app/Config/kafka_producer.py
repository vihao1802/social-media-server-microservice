from aiokafka import AIOKafkaProducer
import json
from dotenv import load_dotenv
import os

load_dotenv()

class KafkaProducer:
    def __init__(self, bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS")):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        await self.producer.start()

    async def send(self, topic: str, message: dict, headers=None):
        await self.producer.send(topic, value=message, headers=headers)

    async def stop(self):
        if self.producer:
            await self.producer.stop()

# Initialize Kafka producer
kafka_producer = KafkaProducer()

header_value = json.dumps({
    "PostMessage": "com.vihao.notificationservice.dto.kafka.PostMessage"
}).encode("utf-8")