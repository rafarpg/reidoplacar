SET NAMES utf8mb4;

DROP TABLE IF EXISTS palpites, partidas, rodadas, liga_membros, ligas, times, usuarios;

CREATE TABLE usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  VARCHAR(255) NOT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ligas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  descricao   VARCHAR(255) NULL,
  dono_id     INT NOT NULL,
  status      ENUM('aguardando','em_andamento','encerrada') NOT NULL DEFAULT 'aguardando',
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ligas_dono FOREIGN KEY (dono_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE liga_membros (
  liga_id     INT NOT NULL,
  usuario_id  INT NOT NULL,
  entrou_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (liga_id, usuario_id),
  CONSTRAINT fk_lm_liga    FOREIGN KEY (liga_id)    REFERENCES ligas(id)    ON DELETE CASCADE,
  CONSTRAINT fk_lm_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE times (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(80) NOT NULL UNIQUE,
  sigla       CHAR(3) NOT NULL UNIQUE,
  escudo_url  VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rodadas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  liga_id        INT NOT NULL,
  numero         TINYINT NOT NULL,
  status         ENUM('futura','aberta','em_andamento','finalizada') NOT NULL DEFAULT 'futura',
  iniciada_em    DATETIME NULL,
  finalizada_em  DATETIME NULL,
  UNIQUE KEY uq_rodada_liga_numero (liga_id, numero),
  CONSTRAINT ck_rodada_numero CHECK (numero BETWEEN 1 AND 7),
  CONSTRAINT fk_rodadas_liga FOREIGN KEY (liga_id) REFERENCES ligas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE partidas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  rodada_id     INT NOT NULL,
  time_casa_id  INT NOT NULL,
  time_fora_id  INT NOT NULL,
  gols_casa     TINYINT NULL,
  gols_fora     TINYINT NULL,
  CONSTRAINT ck_partida_times CHECK (time_casa_id <> time_fora_id),
  CONSTRAINT ck_partida_gols  CHECK ((gols_casa IS NULL OR gols_casa BETWEEN 0 AND 4)
                                 AND (gols_fora IS NULL OR gols_fora BETWEEN 0 AND 4)),
  CONSTRAINT fk_partidas_rodada FOREIGN KEY (rodada_id)    REFERENCES rodadas(id) ON DELETE CASCADE,
  CONSTRAINT fk_partidas_casa   FOREIGN KEY (time_casa_id) REFERENCES times(id),
  CONSTRAINT fk_partidas_fora   FOREIGN KEY (time_fora_id) REFERENCES times(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE palpites (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT NOT NULL,
  partida_id     INT NOT NULL,
  gols_casa      INT UNSIGNED NOT NULL,
  gols_fora      INT UNSIGNED NOT NULL,
  pontos         TINYINT NULL,
  atualizado_em  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_palpite_usuario_partida (usuario_id, partida_id),
  CONSTRAINT ck_palpite_pontos CHECK (pontos IS NULL OR pontos IN (0,2,5,7,10)),
  CONSTRAINT fk_palpites_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_palpites_partida FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO times (nome, sigla) VALUES
  ('Flamengo','FLA'), ('Palmeiras','PAL'), ('Cruzeiro','CRU'), ('Fluminense','FLU'),
  ('Athletico-PR','CAP'), ('Bahia','BAH'), ('Atlético-MG','CAM'), ('Santos','SAN');
