package com.vihao.chat_service.service;

import com.vihao.chat_service.entity.Counter;
import com.vihao.chat_service.service.interfaces.SequenceGenerator;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CounterGenerator implements SequenceGenerator {
    MongoTemplate mongoTemplate;

    @Override
    public long generateSequenceValue(String seqName) {
        Counter cnt = mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id").is(seqName)), // find the _id has the value is seqName
                new Update().inc("sequenceValue",1), // update sequenceValue by increasing 1
                FindAndModifyOptions.options().returnNew(true), // Return the updated document
                Counter.class
        );

        if(cnt == null) {
            // can not find available _id, will create a new one
            Counter newCnt = new Counter();
            newCnt.setId(seqName);
            newCnt.setSequenceValue(1);
            mongoTemplate.save(newCnt);
            return 1;
        }

        return cnt.getSequenceValue();
    }
}
