package com.hotelbooking.config;

import com.hotelbooking.service.InventoryInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Triggers idempotent inventory top-up on application startup when enabled.
 */
@Component
@ConditionalOnProperty(name = "app.inventory.auto-init-on-startup", havingValue = "true", matchIfMissing = true)
public class InventoryStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(InventoryStartupRunner.class);
    private final InventoryInitializer inventoryInitializer;

    public InventoryStartupRunner(InventoryInitializer inventoryInitializer) {
        this.inventoryInitializer = inventoryInitializer;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Running on-startup inventory top-up...");
        int added = inventoryInitializer.initializeInventory();
        log.info("Startup inventory top-up added {} rows.", added);
    }
}
