import {csv} from "https://cdn.skypack.dev/d3-fetch@3";

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10)
}

const dataEndpoint = "https://raw.githubusercontent.com/stripitdown/borodle/main/docs/borodle-data.csv"
function fetchBorodleData(dateToday, callback) {
  csv(dataEndpoint).then((data) => {
    const pickForToday = data.filter(i => i['date'] === dateToday)
    if (pickForToday.length) {
      if (typeof callback === 'function') {
        callback(pickForToday[0]['name'])
      }
    } else {
      // should default to something if it fails to fetch today's pick
      console.log("unable to collect pick for today")
    }
  });
}

// temp function for testing today mechanics
function resetPlayedToday() {
  window.localStorage.removeItem("lastVisitedDate")
  window.localStorage.setItem("completedToday", false)
}
window.resetPlayedToday = resetPlayedToday

document.addEventListener("DOMContentLoaded", () => {
  let guessedWordCount = 0;
  let availableSpace = 1;
  let guessedWords = [[]];
  let lastVisitedDate = "2021-07-07"
  let dateToday = getTodayDate()
  let completedToday = false
  let eventListenersActive = false

  fetchBorodleData(dateToday, loadLocalStorage)
      
    let currentWord;

    initHelpModal();
    initStatsModal();
    createSquares();

    function loadLocalStorage(nameOfTheDay) {
      guessedWordCount =
        Number(window.localStorage.getItem("guessedWordCount")) ||
        guessedWordCount;
      availableSpace =
        Number(window.localStorage.getItem("availableSpace")) || availableSpace;
      guessedWords =
        JSON.parse(window.localStorage.getItem("guessedWords")) || guessedWords;
      lastVisitedDate =
        window.localStorage.getItem("lastVisitedDate") || lastVisitedDate;
      completedToday =
        (window.localStorage.getItem("completedToday") === 'true') || completedToday;

      currentWord = nameOfTheDay;

      if (lastVisitedDate !== dateToday) {
        console.log('first visit today')
        resetGameState()
        updateLastVisitedDate()
      }
  
      const storedBoardContainer = window.localStorage.getItem("boardContainer");
      if (storedBoardContainer) {
        document.getElementById("game-container").innerHTML =
          storedBoardContainer;
      }
  
      const storedKeyboardContainer =
        window.localStorage.getItem("keyboardContainer");
      if (storedKeyboardContainer) {
        document.getElementById("game-keyboard").innerHTML =
          storedKeyboardContainer;
      }

      setListeners()
    }

    function setListeners() {
      if (!completedToday && !eventListenersActive) {
        addKeyboardClicks();
        addKeyboardPresses()
      }
    }
  
    function resetGameState() {
      window.localStorage.removeItem("guessedWordCount");
      window.localStorage.removeItem("guessedWords");
      window.localStorage.removeItem("keyboardContainer");
      window.localStorage.removeItem("boardContainer");
      window.localStorage.removeItem("availableSpace");
      updateCompletedToday(false);
    }

    function createSquares() {
      const gameBoard = document.getElementById("board");
  
      for (let i = 0; i < 30; i++) {
        let square = document.createElement("div");
        square.classList.add("animate__animated");
        square.classList.add("square");
        square.setAttribute("id", i + 1);
        gameBoard.appendChild(square);
      }
    }

    function updateLastVisitedDate() {
      window.localStorage.setItem("lastVisitedDate", dateToday)
    }

    function updateCompletedToday(completedToday) {
      window.localStorage.setItem("completedToday", completedToday)
    }
  
    function preserveGameState() {
      window.localStorage.setItem("guessedWords", JSON.stringify(guessedWords));
  
      const keyboardContainer = document.getElementById("game-keyboard");
      window.localStorage.setItem(
        "keyboardContainer",
        keyboardContainer.innerHTML
      );
  
      const boardContainer = document.getElementById("game-container");
      window.localStorage.setItem("boardContainer", boardContainer.innerHTML);
    }

    function getCurrentWordArr() {
      const numberOfGuessedWords = guessedWords.length;
      return guessedWords[numberOfGuessedWords - 1];
    }
  
    function updateGuessedLetters(letter) {
      const currentWordArr = getCurrentWordArr();
  
      if (currentWordArr && currentWordArr.length < 5) {
        currentWordArr.push(letter);
  
        const availableSpaceEl = document.getElementById(availableSpace);
  
        availableSpaceEl.textContent = letter;
        availableSpace = availableSpace + 1;
      }
    }
  
    function updateTotalGames() {
      const totalGames = window.localStorage.getItem("totalGames") || 0;
      window.localStorage.setItem("totalGames", Number(totalGames) + 1);
    }

    function showResult() {
      const finalResultEl = document.getElementById("final-score");
      finalResultEl.textContent = "Borodle - Golazo! Back of the Net!";

      const totalWins = window.localStorage.getItem("totalWins") || 0;
      window.localStorage.setItem("totalWins", Number(totalWins) + 1);

      const currentStreak = window.localStorage.getItem("currentStreak") || 0;
      window.localStorage.setItem("currentStreak", Number(currentStreak) + 1);
    }
  
    function showLosingResult() {
      const finalResultEl = document.getElementById("final-score");
      finalResultEl.textContent = `Borodle - Full Time: You're beaten :(`;

      window.localStorage.setItem("currentStreak", 0);
    }
  
    function clearBoard() {
      for (let i = 0; i < 30; i++) {
        let square = document.getElementById(i + 1);
        square.textContent = "";
      }
  
      const keys = document.getElementsByClassName("keyboard-button");
  
      for (var key of keys) {
        key.disabled = true;
      }
    }

    function getIndicesOfLetter(letter, arr) {
      const indices = [];
      let idx = arr.indexOf(letter);
      while (idx != -1) {
        indices.push(idx);
        idx = arr.indexOf(letter, idx + 1);
      }
      return indices;
    }
  
    function getTileClass(letter, index, currentWordArr) {
      const isCorrectLetter = currentWord
        .toUpperCase()
        .includes(letter.toUpperCase());
  
      if (!isCorrectLetter) {
        return "incorrect-letter";
      }
  
      const letterInThatPosition = currentWord.charAt(index);
      const isCorrectPosition =
        letter.toLowerCase() === letterInThatPosition.toLowerCase();
  
      if (isCorrectPosition) {
        return "correct-letter-in-place";
      }
  
      const isGuessedMoreThanOnce =
        currentWordArr.filter((l) => l === letter).length > 1;
  
      if (!isGuessedMoreThanOnce) {
        return "correct-letter";
      }
  
      const existsMoreThanOnce =
        currentWord.split("").filter((l) => l === letter).length > 1;
  
      // is guessed more than once and exists more than once
      if (existsMoreThanOnce) {
        return "correct-letter";
      }
  
      const hasBeenGuessedAlready = currentWordArr.indexOf(letter) < index;
  
      const indices = getIndicesOfLetter(letter, currentWord.split(""));
      const otherIndices = indices.filter((i) => i !== index);
      const isGuessedCorrectlyLater = otherIndices.some(
        (i) => i > index && currentWordArr[i] === letter
      );
  
      if (!hasBeenGuessedAlready && !isGuessedCorrectlyLater) {
        return "correct-letter";
      }
  
      return "incorrect-letter";
    }
  
    async function handleSubmitWord() {
      const currentWordArr = getCurrentWordArr();
      const guessedWord = currentWordArr.join("");
  
      if (guessedWord.length !== 5) {
        return;
      }
  
      try {
      
        const firstLetterId = guessedWordCount * 5 + 1;

        console.log("First letter id", firstLetterId)

        localStorage.setItem("availableSpace", availableSpace);

        console.log("Current word array", currentWordArr)
  
        const interval = 200;
        currentWordArr.forEach((letter, index) => {
          setTimeout(() => {
            const tileClass = getTileClass(letter, index, currentWordArr);
            if (tileClass) {
              const letterId = firstLetterId + index;
              const letterEl = document.getElementById(letterId);
              letterEl.classList.add("animate__flipInX");
              letterEl.classList.add(tileClass);
  
              const keyboardEl = document.querySelector(`[data-key=${letter}]`);
              keyboardEl.classList.add(tileClass);
            }
            if (index === 4) {
              preserveGameState();
            }
          }, index * interval);
        });
  
        guessedWordCount += 1;
        window.localStorage.setItem("guessedWordCount", guessedWordCount);
  
        if (guessedWord === currentWord) {
          updateCompletedToday(true);
          setTimeout(() => {
            const okSelected = window.confirm(
              `Yes! Bang on target! The word is "${currentWord.toUpperCase()}".`);
            if (okSelected) {
              clearBoard();
              showResult();
              updateTotalGames();
            }
            return;
          }, 1200);
        }
  
        if (guessedWords.length === 6 && guessedWord !== currentWord) {
          updateCompletedToday(true);
          setTimeout(() => {
            const okSelected = window.confirm(
              `Ah no, you've blown it. The word is "${currentWord.toUpperCase()}".`
            );
            if (okSelected) {
              updateTotalGames();
            }
            return;
          }, 1200);
        }
  
        guessedWords.push([]);
      } catch (_error) {
        window.alert("Nope – that word ain't in the Borodictionary!");
      }
    }
  
    function handleDelete() {
      const currentWordArr = getCurrentWordArr();
  
      if (!currentWordArr.length) {
        return;
      }
  
      currentWordArr.pop();
  
      guessedWords[guessedWords.length - 1] = currentWordArr;
  
      const lastLetterEl = document.getElementById(availableSpace - 1);
  
      lastLetterEl.innerHTML = "";
      availableSpace = availableSpace - 1;
    }
  
    function addKeyboardClicks() {
      const keys = document.querySelectorAll(".keyboard-row button");
      for (let i = 0; i < keys.length; i++) {
        keys[i].addEventListener("click", ({ target }) => {
          const key = target.getAttribute("data-key");
  
          if (key === "enter") {
            handleSubmitWord();
            return;
          }
  
          if (key === "del") {
            handleDelete();
            return;
          }
  
          updateGuessedLetters(key);
        });
      }
    }

    function addKeyboardPresses() {
      const $keyboard = document.getElementById('game-keyboard')
      function keyPressHandler(e) {
        const pressedKey = e.key.toLowerCase()
        const $match = $keyboard.querySelectorAll(`[data-key="${pressedKey}"]`)
        if ($match.length) {
          $match[0].click()
        } else if (pressedKey === 'backspace') {
          handleDelete();
          return;
        }
      }

      const $body = document.querySelector('body')
      $body.addEventListener('keyup', keyPressHandler)
    }
  
    function initHelpModal() {
      const modal = document.getElementById("help-modal");
  
      // Get the button that opens the modal
      const btn = document.getElementById("help");
  
      // Get the <span> element that closes the modal
      const span = document.getElementById("close-help");
  
      // When the user clicks on the button, open the modal
      btn.addEventListener("click", function () {
        modal.style.display = "block";
      });
  
      // When the user clicks on <span> (x), close the modal
      span.addEventListener("click", function () {
        modal.style.display = "none";
      });
  
      // When the user clicks anywhere outside of the modal, close it
      window.addEventListener("click", function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      });
    }
  
    function updateStatsModal() {
      const currentStreak = window.localStorage.getItem("currentStreak");
      const totalWins = window.localStorage.getItem("totalWins");
      const totalGames = window.localStorage.getItem("totalGames");
  
      document.getElementById("total-played").textContent = totalGames;
      document.getElementById("total-wins").textContent = totalWins;
      document.getElementById("current-streak").textContent = currentStreak;
  
      const winPct = Math.round((totalWins / totalGames) * 100) || 0;
      document.getElementById("win-pct").textContent = winPct;
    }
  

    function initStatsModal() {
      const modal = document.getElementById("stats-modal");
  
      // Get the button that opens the modal
      const btn = document.getElementById("stats");
  
      // Get the <span> element that closes the modal
      const span = document.getElementById("close-stats");
  
      // When the user clicks on the button, open the modal
      btn.addEventListener("click", function () {
        // update stats here
        updateStatsModal();
        modal.style.display = "block";
      });
  
      // When the user clicks on <span> (x), close the modal
      span.addEventListener("click", function () {
        modal.style.display = "none";
      });
  
      // When the user clicks anywhere outside of the modal, close it
      window.addEventListener("click", function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
      });
    }
  });
