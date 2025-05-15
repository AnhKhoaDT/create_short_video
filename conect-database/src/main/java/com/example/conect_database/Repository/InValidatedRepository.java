package com.example.conect_database.Repository;

import com.example.conect_database.entity.InValidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InValidatedRepository extends JpaRepository<InValidatedToken,String> {
}
