package com.auca.attendance.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Holds a registry of SSE emitters keyed by userId.
 * Multiple tabs/connections per user are supported via a list per user.
 */
@Service
@Slf4j
public class SseEmitterService {

    /** userId → active emitters for that user */
    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /**
     * Register a new SSE emitter for a user and return it.
     * The emitter cleans itself up on completion, timeout, or error.
     */
    public SseEmitter register(Long userId) {
        SseEmitter emitter = new SseEmitter(0L); // no server-side timeout

        emitters.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> remove(userId, emitter));
        emitter.onError(e -> remove(userId, emitter));

        log.debug("SSE emitter registered for userId={}", userId);
        return emitter;
    }

    /**
     * Push an event named "notification" to all active emitters for the given user.
     * Dead emitters are pruned automatically.
     */
    public void send(Long userId, Object data) {
        List<SseEmitter> userEmitters = emitters.getOrDefault(userId, List.of());
        if (userEmitters.isEmpty()) return;

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(data));
            } catch (Exception e) {
                log.debug("Dead SSE emitter for userId={}, removing", userId);
                dead.add(emitter);
            }
        }
        userEmitters.removeAll(dead);
    }

    private void remove(Long userId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) list.remove(emitter);
    }
}
