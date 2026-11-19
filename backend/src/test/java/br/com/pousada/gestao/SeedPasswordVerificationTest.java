package br.com.pousada.gestao;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class SeedPasswordVerificationTest {

    @Test
    void hashesDoFlywayDevemCorresponderAsSenhasDocumentadas() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        assertThat(encoder.matches("gerente123", "$2a$10$uQEU0aXMMtnBOLVujxQYz.illAFbFbOvKZnT403aikaEDBUQxeMC.")).isTrue();
        assertThat(encoder.matches("atendente123", "$2a$10$56y0RbmaEFDdI85JA1KJm.tbW0l/5Wz5rejIhef6DdqwlaA1Ufvn2")).isTrue();
        assertThat(encoder.matches("atendente123", "$2a$10$dXdSSYmGdj3FU5AnMR6DOunbOOWAJ8z5HYkgOQYIk/ownc4HU8/KG")).isTrue();
        assertThat(encoder.matches("atendente123", "$2a$10$Tbm.TXcjaOr7mVDXx8p5l.BuJNe5Jrk55zPd5tkkC9NIsnkYIsm7W")).isTrue();
    }
}
