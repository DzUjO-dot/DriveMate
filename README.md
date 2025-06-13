# DriveMate

Aplikacja mobilna do zarządzania pojazdami i kontrolowania wydatków związanych z ich użytkowaniem. Aplikacja umożliwia dodawanie pojazdów, rejestrowanie tankowań, śledzenie kosztów oraz przeglądanie statystyk zużycia paliwa – wszystko lokalnie na telefonie.

---

## Kluczowe funkcjonalności

- Rejestracja i logowanie użytkowników (lokalne)
- Dodawanie, edycja i usuwanie pojazdów
- Rejestrowanie tankowań z datą, ceną i przebiegiem
- Statystyki zużycia paliwa (średnia, suma, historia)
- Przechowywanie danych lokalnie z użyciem AsyncStorage
- Obsługa trybu ciemnego/jasnego (planowane)
- Skanowanie dokumentów i zapisywanie zdjęć (planowane)
- Przypomnienia push (planowane)

---

## 🛠️ Technologie

| Technologia          | Opis                                    |
|----------------------|-----------------------------------------|
| **React Native**     | Framework do budowy aplikacji mobilnych |
| **Expo**             | Narzędzia i środowisko uruchomieniowe   |
| **TypeScript**       | Bezpieczne typowanie kodu               |
| **AsyncStorage**     | Lokalna baza danych offline             |
| **Context API**      | Zarządzanie stanem użytkownika          |
| **React Navigation** | Nawigacja między ekranami               |

---

##  Jak uruchomić projekt

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/DzUjO-dot/DriveMate.git
cd DriveMate

# 2. Instalacja zależności
npm install

# 3. Instalacja Node.js
https://nodejs.org/en

# 4. Instalacja Expo CLI
npm install  expo-cli

# 5. Uruchomienie aplikacji
npx expo start
