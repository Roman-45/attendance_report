package com.auca.attendance.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token-bucket rate limiter.
 * Each unique key (e.g. IP address or email) gets its own bucket.
 * Buckets are created lazily and never expire — acceptable for a single-instance
 * deployment. For multi-instance deployments, replace with Bucket4j + Redis.
 */
@Service
public class RateLimitService {

    // Separate bucket maps per limit type so different endpoints can have different windows

    /** Login / verify-mfa: 10 attempts per IP per minute */
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();

    /** Verify-mfa: stricter 5 attempts per IP per 10 minutes */
    private final Map<String, Bucket> mfaBuckets = new ConcurrentHashMap<>();

    /** Forgot-password: 3 requests per email per hour */
    private final Map<String, Bucket> forgotPasswordBuckets = new ConcurrentHashMap<>();

    /** MFA enable: 3 requests per user per 5 minutes */
    private final Map<String, Bucket> mfaEnableBuckets = new ConcurrentHashMap<>();

    public boolean tryConsumeLogin(String ip) {
        return loginBuckets
                .computeIfAbsent(ip, k -> newBucket(10, Duration.ofMinutes(1)))
                .tryConsume(1);
    }

    public boolean tryConsumeMfaVerify(String ip) {
        return mfaBuckets
                .computeIfAbsent(ip, k -> newBucket(5, Duration.ofMinutes(10)))
                .tryConsume(1);
    }

    public boolean tryConsumeForgotPassword(String email) {
        return forgotPasswordBuckets
                .computeIfAbsent(email.toLowerCase(), k -> newBucket(3, Duration.ofHours(1)))
                .tryConsume(1);
    }

    public boolean tryConsumeMfaEnable(String userId) {
        return mfaEnableBuckets
                .computeIfAbsent(userId, k -> newBucket(3, Duration.ofMinutes(5)))
                .tryConsume(1);
    }

    // ─── Factory ─────────────────────────────────────────────────────────────

    private Bucket newBucket(long capacity, Duration refillPeriod) {
        // Intervally refill: full capacity restored once per period (fixed window).
        // refillGreedy would refill continuously, allowing slow requests to slip through
        // because tokens regenerate between them. refillIntervally blocks exactly
        // `capacity` requests per period regardless of how slowly they arrive.
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillIntervally(capacity, refillPeriod)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }
}
