package com.vihao.chat_service.service;

import io.minio.*;
import io.minio.errors.MinioException;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadFileService {
    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.bucket.path}")
    private String bucketPathName;

    @Value("${minio.preview-image-endpoint}")
    private String  minioPreviewImageEndpoint;

    public String uploadBase64File (String base64File, String fileName) {
        try {
            // Decode base64 file
            byte[] fileBytes = Base64.getDecoder().decode(base64File);

            // Upload file to minio storage
            minioClient.putObject(
              PutObjectArgs.builder()
                      .bucket(bucketName)
                      .object(fileName)
                      .stream(new ByteArrayInputStream(fileBytes), fileBytes.length , -1)
                      .contentType("application/octet-stream")
                      .build()
            );
            System.out.println("Uploaded file successfully: " + fileName);

            return minioPreviewImageEndpoint + "/api/v1/buckets/" + bucketName + "/objects/download?preview=true&prefix=chat-service%2F" + fileName + "&version_id=null";
        } catch (Exception e) {
            throw new RuntimeException("Error minio upload: " + e.getMessage());
        }
    }

    @SneakyThrows(Exception.class)
    public String uploadFile(MultipartFile file, String fileName) {

        boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
        if (!bucketExists) {
            // Create the bucket
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
        }

        // Get the input stream of the file
        try (InputStream fileInputStream = file.getInputStream()) {
            // Combine path and file name to create the object name
            String objectName = bucketPathName + "/" + fileName;

            // Upload the file to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(fileInputStream, file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            System.out.println("Uploaded file successfully: " + fileName);
            /*return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs
                            .builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );*/

            // Return the permanent URL
            return minioPreviewImageEndpoint + "/api/v1/buckets/" + bucketName + "/objects/download?preview=true&prefix=chat-service%2F" + fileName + "&version_id=null";
        } catch (MinioException e) {
            log.error("Error minio upload: {}", e.getMessage());
            throw new IOException();
        }
    }
}
