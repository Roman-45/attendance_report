package com.auca.attendance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that enforces IP-based rate limits before the JWT filter runs.
 *
 * All limits are keyed by the client's IP address (X-Forwarded-For → remoteAddr).
 * This avoids reading the request body in the filter, which would break
 * Spring's @RequestBody deserialization downstream.
 *
 * Limits applied:
 *   POST /api/v1/auth/login           → 10 req / 1 min  per IP
 *   POST /api/v1/auth/verify-mfa      → 5  req / 10 min per IP
 *   POST /api/v1/auth/forgot-password → 3  req / 1 hr   per IP
 *   POST /api/v1/auth/mfa/enable      → 3  req / 5 min  per IP
 *
 * Returns 429 Too Many Requests with a standard ApiResponse-shaped JSON body.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path   = request.getServletPath();
        String method = request.getMethod();

        if (!"POST".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        String ip = resolveClientIp(request);

        // retryAfterSeconds mirrors the refill window of each bucket in RateLimitService
        int retryAfterSeconds = switch (path) {
            case "/api/v1/auth/login"            -> 60;    // 1-min window
            case "/api/v1/auth/verify-mfa"       -> 600;   // 10-min window
            case "/api/v1/auth/forgot-password"  -> 3600;  // 1-hr window
            case "/api/v1/auth/mfa/enable"       -> 300;   // 5-min window
            default                              -> 60;
        };

        boolean allowed = switch (path) {
            case "/api/v1/auth/login"            -> rateLimitService.tryConsumeLogin(ip);
            case "/api/v1/auth/verify-mfa"       -> rateLimitService.tryConsumeMfaVerify(ip);
            case "/api/v1/auth/forgot-password"  -> rateLimitService.tryConsumeForgotPassword(ip);
            case "/api/v1/auth/mfa/enable"       -> rateLimitService.tryConsumeMfaEnable(ip);
            default                              -> true;
        };

        if (!allowed) {
            sendTooManyRequests(response, retryAfterSeconds);
            return;
        }

        chain.doFilter(request, response);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendTooManyRequests(HttpServletResponse response, int retryAfterSeconds)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.getWriter().write(
                "{\"success\":false,\"message\":\"Too many requests — please try again later\",\"data\":null}");
    }
}
