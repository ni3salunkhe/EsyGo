package com.hotelbooking.testutil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility for resetting and initializing test database tables from db/schema.sql.
 * Enforces safety guard: refuses execution if database name does not end with '_test'.
 */
@Component
public class TestDatabaseBootstrap {

    private static final Logger log = LoggerFactory.getLogger(TestDatabaseBootstrap.class);

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public TestDatabaseBootstrap(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Resets the test database schema: drops existing tables and applies db/schema.sql.
     */
    public void resetSchema() {
        validateTestDatabaseName();

        log.info("Resetting test database tables...");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        jdbcTemplate.execute("DROP TABLE IF EXISTS room_night");
        jdbcTemplate.execute("DROP TABLE IF EXISTS booking");
        jdbcTemplate.execute("DROP TABLE IF EXISTS hotel_amenity");
        jdbcTemplate.execute("DROP TABLE IF EXISTS room");
        jdbcTemplate.execute("DROP TABLE IF EXISTS amenity");
        jdbcTemplate.execute("DROP TABLE IF EXISTS hotel");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");

        executeSqlFile(findSqlFile("db/schema.sql"));
        log.info("Test database schema reset completed successfully.");
    }

    /**
     * Applies sample data from db/seed.sql to the test database.
     */
    public void applySeed() {
        validateTestDatabaseName();
        log.info("Applying db/seed.sql to test database...");
        executeSqlFile(findSqlFile("db/seed.sql"));
        log.info("Seed data applied to test database successfully.");
    }

    /**
     * Inspects the connected database name and asserts that it ends with '_test'.
     *
     * @throws IllegalStateException if database name is invalid or does not end with '_test'
     */
    public void validateTestDatabaseName() {
        String dbName = extractDatabaseName();
        validateDatabaseName(dbName);
    }

    /**
     * Pure validation logic to enable unit testing DB-04 against arbitrary names.
     */
    public static void validateDatabaseName(String dbName) {
        if (dbName == null || !dbName.toLowerCase().endsWith("_test")) {
            throw new IllegalStateException(
                    String.format("Refusing to reset database: name '%s' does not end with '_test'. " +
                            "Tests must run only against a dedicated test database whose name ends with '_test'.", dbName)
            );
        }
    }

    public String extractDatabaseName() {
        try (Connection conn = dataSource.getConnection()) {
            String catalog = conn.getCatalog();
            if (catalog != null && !catalog.isBlank()) {
                return catalog;
            }
            String url = conn.getMetaData().getURL();
            return parseDatabaseNameFromUrl(url);
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to determine connected database name: " + e.getMessage(), e);
        }
    }

    public static String parseDatabaseNameFromUrl(String url) {
        if (url == null) {
            return null;
        }
        int qIdx = url.indexOf('?');
        String clean = qIdx >= 0 ? url.substring(0, qIdx) : url;
        int slashIdx = clean.lastIndexOf('/');
        if (slashIdx >= 0 && slashIdx < clean.length() - 1) {
            return clean.substring(slashIdx + 1);
        }
        return clean;
    }

    private void executeSqlFile(Path path) {
        String content;
        try {
            content = Files.readString(path, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read SQL file at " + path.toAbsolutePath() + ": " + e.getMessage(), e);
        }

        List<String> statements = splitSqlStatements(content);
        for (String sql : statements) {
            if (!sql.isBlank()) {
                jdbcTemplate.execute(sql);
            }
        }
    }

    public static List<String> splitSqlStatements(String sqlContent) {
        List<String> statements = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String line : sqlContent.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--") || trimmed.startsWith("#")) {
                continue;
            }
            current.append(line).append("\n");
            if (trimmed.endsWith(";")) {
                String stmt = current.toString().trim();
                if (stmt.endsWith(";")) {
                    stmt = stmt.substring(0, stmt.length() - 1).trim();
                }
                if (!stmt.isEmpty()) {
                    statements.add(stmt);
                }
                current.setLength(0);
            }
        }
        String remaining = current.toString().trim();
        if (!remaining.isEmpty()) {
            statements.add(remaining);
        }
        return statements;
    }

    private Path findSqlFile(String relativePath) {
        Path direct = Paths.get(relativePath);
        if (Files.exists(direct)) {
            return direct;
        }
        Path parent = Paths.get("..", relativePath);
        if (Files.exists(parent)) {
            return parent;
        }
        throw new IllegalStateException("Cannot locate required SQL file: " + relativePath);
    }
}
