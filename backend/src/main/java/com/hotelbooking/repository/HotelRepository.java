package com.hotelbooking.repository;

import com.hotelbooking.domain.Hotel;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @EntityGraph(attributePaths = {"amenities"})
    List<Hotel> findAllByOrderByNameAsc();

    @EntityGraph(attributePaths = {"amenities"})
    List<Hotel> findByLocationIgnoreCaseOrderByNameAsc(String location);

    @EntityGraph(attributePaths = {"amenities"})
    Optional<Hotel> findWithAmenitiesById(Long id);

    @EntityGraph(attributePaths = {"amenities"})
    List<Hotel> findAllWithAmenitiesByIdIn(Collection<Long> ids);
}
