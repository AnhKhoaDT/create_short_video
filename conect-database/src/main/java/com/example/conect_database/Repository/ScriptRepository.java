package com.example.conect_database.Repository;

import com.example.conect_database.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScriptRepository extends JpaRepository<Script, Long> {
}