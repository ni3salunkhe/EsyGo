package com.hotelbooking.service;

import com.hotelbooking.exception.ConcurrencyConflictException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.ConcurrencyFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.util.function.Supplier;

/**
 * Separate bean / facade that retries a transactional operation exactly once upon MySQL deadlock.
 * Adheres strictly to docs/01 section 10 Amendment A2 and Spring proxy self-invocation rules.
 */
@Component
public class DeadlockRetryWrapper {

    private static final Logger log = LoggerFactory.getLogger(DeadlockRetryWrapper.class);
    private static final int MYSQL_DEADLOCK_ERROR_CODE = 1213;
    private static final String SQLSTATE_DEADLOCK = "40001";

    /**
     * Executes the supplied action, retrying once if a deadlock occurs.
     * Throws ConcurrencyConflictException if the second attempt also deadlocks.
     */
    public <T> T runWithRetry(Supplier<T> action) {
        try {
            return action.get();
        } catch (Throwable firstEx) {
            if (!isDeadlock(firstEx)) {
                if (firstEx instanceof RuntimeException re) {
                    throw re;
                }
                throw new RuntimeException(firstEx);
            }

            log.warn("Deadlock detected during execution; retrying operation once...", firstEx);

            try {
                return action.get();
            } catch (Throwable secondEx) {
                if (isDeadlock(secondEx)) {
                    log.error("Operation deadlocked again on retry; surfacing CONCURRENCY_CONFLICT.", secondEx);
                    throw new ConcurrencyConflictException(
                            "Transaction could not be completed due to concurrent lock conflicts. Please retry.",
                            secondEx
                    );
                }
                if (secondEx instanceof RuntimeException re) {
                    throw re;
                }
                throw new RuntimeException(secondEx);
            }
        }
    }

    /**
     * Inspects the exception hierarchy to determine whether the root cause is a database deadlock.
     */
    public boolean isDeadlock(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof PessimisticLockingFailureException
                    || current instanceof ConcurrencyFailureException) {
                return true;
            }
            if (current instanceof SQLException sqlEx) {
                if (sqlEx.getErrorCode() == MYSQL_DEADLOCK_ERROR_CODE
                        || SQLSTATE_DEADLOCK.equals(sqlEx.getSQLState())) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
