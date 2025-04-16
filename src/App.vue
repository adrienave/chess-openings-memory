<script setup lang="ts">
import {BoardApi, BoardConfig, TheChessboard} from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { ref, reactive, onMounted, Ref, Reactive } from 'vue';
import { Opening, openings } from '@/data/openings';
import _ from "lodash";

const DELAY_BETWEEN_ROUNDS_MS = 500;
const DELAY_REFRESH_TURN_COLOR_MS = 50;

const isDevMode = process.env.NODE_ENV === 'development';

const currentOpening: Ref<Opening> = ref(undefined);
const suggestions: Ref<string[]> = ref([]);
const boardConfig: Reactive<BoardConfig> = reactive({
  viewOnly: true
});
let boardAPI: BoardApi;
const points = ref(0);
const round = ref(0);
const roundStarted = ref(true);
const turnColor = ref("");

const refreshTurnColor = () => {
  turnColor.value = boardAPI?.getTurnColor();
}

const pickOpening = () => {
  let newOpening: Opening;
  do {
    newOpening = _.sample(openings);
  } while (newOpening.fen === currentOpening.value?.fen)

  currentOpening.value = newOpening
  boardConfig.fen = currentOpening.value?.fen;

  suggestions.value = [currentOpening.value?.name];
  while (suggestions.value.length < 4) {
    let suggestedOpening = _.sample(openings);
    if (!suggestions.value.includes(suggestedOpening.name)) {
      suggestions.value.push(suggestedOpening.name)
    }
  }
  suggestions.value = _.shuffle(suggestions.value);
  roundStarted.value = true;

  setTimeout(refreshTurnColor, DELAY_REFRESH_TURN_COLOR_MS)
}

const resetSuggestionBackground = (suggestionElement: Element) => {
  suggestionElement.classList.remove('correct');
  suggestionElement.classList.remove('invalid');
}

const selectSuggestion = (suggestion: string, event: Event) => {
  const suggestionElement = event.target;
  if (!(suggestionElement instanceof Element)) {
    return;
  }
  if (currentOpening.value.name === suggestion) {
    points.value++;
    suggestionElement.classList.add('correct');
  } else {
    suggestionElement.classList.add('invalid');
  }
  round.value++;
  roundStarted.value = false;
  setTimeout(pickOpening, DELAY_BETWEEN_ROUNDS_MS);
  setTimeout(() => resetSuggestionBackground(suggestionElement), DELAY_BETWEEN_ROUNDS_MS);
}

pickOpening();

const toggleSpoiler = (event: Event) => {
  if (!(event.target instanceof Element)) {
    return;
  }
  event.target.classList.toggle('spoiler');
}

onMounted(() => {
  refreshTurnColor();
});
</script>

<template>
  <header>
    <h1>Chess Openings Memory</h1>
  </header>

  <main>
    <div>
      <TheChessboard id="chessboard" :board-config="boardConfig" @board-created="(api) => {
        boardAPI = api;
      }" reactive-config />
      <p>{{ boardConfig.fen }}</p>
    </div>
    <aside>
      <p>Score: {{ points }} / {{ round }}</p>
      <p>Difficulty: {{currentOpening.difficulty}}</p>
      <p>{{ turnColor }} to play</p>
      <div id="suggestions">
        <button v-for="suggestion in suggestions" @click="selectSuggestion(suggestion, $event)" :disabled="!roundStarted">
          {{ suggestion }}
        </button>
      </div>
      <h2 class="spoiler" @click="toggleSpoiler" v-if="isDevMode">{{ currentOpening.name }}</h2>
    </aside>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  margin-bottom: 1rem;
}

main {
  display: flex;
}

aside {
  margin-left: 2rem;
  width: 700px;

  p::first-letter {
    text-transform: capitalize;
  }

  #suggestions {
    position: absolute;
    top: 50%;
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    display: flex;
    flex-wrap: wrap;
    padding-bottom: 2rem;

    button {
      width: 300px;
      overflow: hidden;
      white-space: nowrap;
      display: block;
      text-overflow: ellipsis;
      margin: 1rem;
      padding: 10px;
      font-size: 25px;
    }
  }
}

.spoiler {
  background-color: var(--color-spoiler);
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}

.correct {
  background-color: var(--color-correct);
  border-color: var(--color-correct);
}

.invalid {
  background-color: var(--color-invalid);
  border-color: var(--color-invalid);
}

button:disabled,
button[disabled]{
  color: var(--color-text);
}
</style>
