package com.mayson.portfolio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ApiController {
    public record ContactRequest(@NotBlank @Size(max = 100) String name,
                                 @NotBlank @Email @Size(max = 150) String email,
                                 @NotBlank @Size(max = 2000) String message) {}

    private final ContactRepository repo;
    private final String adminKey;

    public ApiController(ContactRepository repo, @Value("${admin.key}") String adminKey) {
        this.repo = repo; this.adminKey = adminKey;
    }

    /** Portfolio content lives in profile-en.json / profile-ar.json: edit those files to update the site. */
    @GetMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public String profile(@RequestParam(defaultValue = "en") String lang) throws IOException {
        String file = "ar".equals(lang) ? "profile-ar.json" : "profile-en.json";
        return new String(new ClassPathResource(file).getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
    }

    @PostMapping("/contact")
    @ResponseStatus(HttpStatus.CREATED)
    public void contact(@Valid @RequestBody ContactRequest r) {
        repo.save(new ContactMessage(r.name().trim(), r.email().trim(), r.message().trim()));
    }

    /** Read your messages: GET /api/messages with header X-Admin-Key. */
    @GetMapping("/messages")
    public List<ContactMessage> messages(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (!adminKey.equals(key)) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return repo.findAll();
    }
}
