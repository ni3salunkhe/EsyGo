package com.hotelbooking.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.PropertyResolver;

import java.util.Arrays;
import java.util.List;

/**
 * Validates that required database environment variables are set.
 * Fails fast on application startup if any required variable is missing.
 */
public class DatabaseEnvironmentValidator implements EnvironmentPostProcessor {

    public static final List<String> REQUIRED_PROD_VARS = List.of(
            "DB_URL",
            "DB_USERNAME",
            "DB_PASSWORD"
    );

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean isTest = Arrays.asList(environment.getActiveProfiles()).contains("test");
        validateEnvironment(environment, isTest);
    }

    /**
     * Validates required properties against the given property resolver.
     *
     * @param resolver property resolver (Environment or mock)
     * @param isTestProfile whether the test profile is active
     */
    public static void validateEnvironment(PropertyResolver resolver, boolean isTestProfile) {
        if (isTestProfile) {
            // Under test profile, database properties are supplied via TEST_DB_* or application-test.properties defaults
            return;
        }

        for (String varName : REQUIRED_PROD_VARS) {
            String value = resolver.getProperty(varName);
            if (value == null || value.trim().isEmpty()) {
                throw new IllegalStateException(
                        String.format("Missing required database environment variable: '%s'. " +
                                "Please ensure DB_URL, DB_USERNAME, and DB_PASSWORD are set in your environment.", varName)
                );
            }
        }
    }
}
