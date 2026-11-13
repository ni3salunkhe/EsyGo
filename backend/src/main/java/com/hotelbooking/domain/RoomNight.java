package com.hotelbooking.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "room_night")
public class RoomNight {

    @EmbeddedId
    private RoomNightId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roomId")
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    private RoomNightStatus status = RoomNightStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "reserved_until")
    private Instant reservedUntil;

    public RoomNight() {
    }

    public RoomNight(RoomNightId id, Room room, RoomNightStatus status, Booking booking, Instant reservedUntil) {
        this.id = id;
        this.room = room;
        this.status = status;
        this.booking = booking;
        this.reservedUntil = reservedUntil;
    }

    public RoomNightId getId() {
        return id;
    }

    public void setId(RoomNightId id) {
        this.id = id;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public RoomNightStatus getStatus() {
        return status;
    }

    public void setStatus(RoomNightStatus status) {
        this.status = status;
    }

    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public Instant getReservedUntil() {
        return reservedUntil;
    }

    public void setReservedUntil(Instant reservedUntil) {
        this.reservedUntil = reservedUntil;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RoomNight roomNight = (RoomNight) o;
        return Objects.equals(id, roomNight.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
