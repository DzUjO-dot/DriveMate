# DriveMate

Aplikacja mobilna do zarządzania pojazdami i kontrolowania wydatków związanych z ich użytkowaniem. Aplikacja umożliwia dodawanie pojazdów, rejestrowanie tankowań, śledzenie kosztów oraz przeglądanie statystyk zużycia paliwa – wszystko lokalnie na telefonie.

---

## Kluczowe funkcjonalności

- Rejestracja i logowanie użytkowników (lokalne)
- Dodawanie, edycja i usuwanie pojazdów
- Rejestrowanie tankowań z datą, ceną i przebiegiem
- Statystyki zużycia paliwa (średnia, suma, historia)
- Przechowywanie danych lokalnie z użyciem AsyncStorage
- Skanowanie dokumentów i zapisywanie zdjęć

---

## Technologie

| Technologia          | Opis                                    |
|----------------------|-----------------------------------------|
| **React Native**     | Framework do budowy aplikacji mobilnych |
| **Expo**             | Narzędzia i środowisko uruchomieniowe   |
| **TypeScript**       | Bezpieczne typowanie kodu               |
| **AsyncStorage**     | Lokalna baza danych offline             |
| **Context API**      | Zarządzanie stanem użytkownika          |
| **React Navigation** | Nawigacja między ekranami               |

---

## Zależności

- @react-navigation/native
- @react-navigation/native-stack
- @react-native-async-storage/async-storage
- expo, expo-status-bar
- react-native-vector-icons
- react-native-safe-area-context
- react-native-screens, react-native-gesture-handler

---

## Architektura projektu

- /screens – wszystkie ekrany aplikacji
- /context – globalny kontekst użytkownika
- /assets – ikony, logo, splash screen
- App.tsx – główny punkt wejściowy
- AppNavigator.tsx – nawigacja ekranów

---
---

## Licencja

Projekt dostępny na licencji **MIT** – możesz go używać, kopiować, modyfikować i rozpowszechniać, pod warunkiem dołączenia informacji o autorze i licencji.

Zobacz pełną treść licencji tutaj:  
[LICENSE](https://github.com/DzUjO-dot/DriveMate/blob/main/LICENSE#L7)
---

## Autorzy
- Imię i nazwisko: 

- Adrian Jaroń
- Oskar Trościanko

---
##  Jak uruchomić projekt

```bash
# 1. Klonowanie repozytorium
git clone https://github.com/DzUjO-dot/DriveMate.git
cd DriveMate

# 2. Instalacja Node.js
https://nodejs.org/en

# 3. Instalacja zależności
npm install

# 4. Instalacja Expo CLI
npm install  expo-cli

# 5. Uruchomienie aplikacji
npx expo start
