package com.auca.attendance.service;

import com.auca.attendance.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${application.upload.dir:uploads}")
    private String uploadDir;

    private Path rootPath;

    @PostConstruct
    public void init() {
        rootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try { Files.createDirectories(rootPath); } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeProfilePhoto(Long studentId, MultipartFile file) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        if (!ext.matches("jpg|jpeg|png|gif")) {
            throw new IllegalArgumentException("Only image files (jpg, png, gif) are allowed");
        }
        String filename = "student-" + studentId + "-" + UUID.randomUUID().toString().substring(0, 8) + "." + ext;
        Path target = rootPath.resolve("photos").resolve(filename);
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return "photos/" + filename;
    }

    public byte[] loadFile(String relativePath) {
        try {
            Path file = rootPath.resolve(relativePath).normalize();
            if (!file.startsWith(rootPath)) throw new SecurityException("Path traversal blocked");
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw new ResourceNotFoundException("File not found: " + relativePath);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
