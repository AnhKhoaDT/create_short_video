package com.example.conect_database.Repository;

import com.example.conect_database.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// giúp thao tác với database mà ko cần code sql
@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);// spring nó sẽ tự thực hiện cho mình lun
    Optional<User> findByUsername(String username);

}
