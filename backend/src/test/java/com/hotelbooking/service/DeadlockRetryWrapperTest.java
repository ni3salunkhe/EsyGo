package com.hotelbooking.service;

import com.hotelbooking.exception.ConcurrencyConflictException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.PessimisticLockingFailureException;

import java.sql.SQLException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DeadlockRetryWrapperTest {

    private final DeadlockRetryWrapper retryWrapper = new DeadlockRetryWrapper();

    @Test
    @DisplayName("RETRY-01: operation without deadlock succeeds on first attempt")
    void normalOperation_succeedsOnFirstAttempt() {
        AtomicInteger attempts = new AtomicInteger(0);

        String result = retryWrapper.runWithRetry(() -> {
            attempts.incrementAndGet();
            return "SUCCESS";
        });

        assertThat(result).isEqualTo("SUCCESS");
        assertThat(attempts.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("RETRY-01: single deadlock on first attempt is retried and succeeds on second attempt")
    void singleDeadlock_retriedAndSucceeds() {
        AtomicInteger attempts = new AtomicInteger(0);
        SQLException deadlockSqlEx = new SQLException("Deadlock found when trying to get lock", "40001", 1213);
        CannotAcquireLockException deadlockEx = new CannotAcquireLockException("Lock deadlock", deadlockSqlEx);

        String result = retryWrapper.runWithRetry(() -> {
            int attempt = attempts.incrementAndGet();
            if (attempt == 1) {
                throw deadlockEx;
            }
            return "RECOVERED";
        });

        assertThat(result).isEqualTo("RECOVERED");
        assertThat(attempts.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("RETRY-01: second deadlock after retry surfaces ConcurrencyConflictException (HTTP 409)")
    void secondDeadlock_throwsConcurrencyConflictException() {
        AtomicInteger attempts = new AtomicInteger(0);
        SQLException deadlockSqlEx = new SQLException("Deadlock found when trying to get lock", "40001", 1213);
        CannotAcquireLockException deadlockEx = new CannotAcquireLockException("Lock deadlock", deadlockSqlEx);

        assertThatThrownBy(() -> retryWrapper.runWithRetry(() -> {
            attempts.incrementAndGet();
            throw deadlockEx;
        }))
                .isInstanceOf(ConcurrencyConflictException.class)
                .hasMessageContaining("Transaction could not be completed due to concurrent lock conflicts");

        assertThat(attempts.get()).isEqualTo(2);
    }

    @Test
    @DisplayName("RETRY-01: non-deadlock exceptions are NOT retried and thrown immediately")
    void nonDeadlockException_thrownImmediatelyWithoutRetry() {
        AtomicInteger attempts = new AtomicInteger(0);

        assertThatThrownBy(() -> retryWrapper.runWithRetry(() -> {
            attempts.incrementAndGet();
            throw new IllegalArgumentException("Bad input parameter");
        }))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Bad input parameter");

        assertThat(attempts.get()).isEqualTo(1);
    }

    @Test
    @DisplayName("RETRY-01: isDeadlock correctly identifies SQLException error code 1213 and SQLState 40001")
    void isDeadlock_identifiesMySqlDeadlockSignatures() {
        SQLException sql1213 = new SQLException("Deadlock", "40001", 1213);
        assertThat(retryWrapper.isDeadlock(sql1213)).isTrue();

        SQLException wrapped = new SQLException("Outer error", new SQLException("Inner deadlock", "40001", 1213));
        assertThat(retryWrapper.isDeadlock(wrapped)).isTrue();

        PessimisticLockingFailureException pessimistic = new PessimisticLockingFailureException("Lock failure", sql1213);
        assertThat(retryWrapper.isDeadlock(pessimistic)).isTrue();

        SQLException otherSql = new SQLException("Syntax error", "42000", 1064);
        assertThat(retryWrapper.isDeadlock(otherSql)).isFalse();
    }
}
