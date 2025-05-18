<script setup lang="ts">
import {BoardApi, BoardConfig, TheChessboard} from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { ref, reactive, onMounted, Ref, Reactive } from 'vue';
import { Opening, openings } from '@/data/openings';
import * as _ from "lodash";

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
const roundEnded = ref(false);
const turnColor = ref("");
const eligibleOpenings = [...openings]

const refreshTurnColor = () => {
  turnColor.value = boardAPI?.getTurnColor();
}

const pickOpening = () => {
  let newOpening: Opening;
  if (eligibleOpenings.length == 0) {
    eligibleOpenings.push(...openings);
  }
  newOpening = _.sample(eligibleOpenings);
  _.pull(eligibleOpenings, newOpening);
  currentOpening.value = newOpening
  boardConfig.fen = currentOpening.value?.fen;

  suggestions.value = [currentOpening.value?.name];
  while (suggestions.value.length < 4) {
    let suggestedOpening = _.sample(openings.filter(opening => opening.category == currentOpening.value.category));
    if (!suggestions.value.includes(suggestedOpening.name)) {
      suggestions.value.push(suggestedOpening.name)
    }
  }
  suggestions.value = _.shuffle(suggestions.value);
  roundEnded.value = false;

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
  } else {
    suggestionElement.classList.add('invalid');
    setTimeout(() => resetSuggestionBackground(suggestionElement), DELAY_BETWEEN_ROUNDS_MS);
  }
  round.value++;
  roundEnded.value = true;
  setTimeout(pickOpening, DELAY_BETWEEN_ROUNDS_MS);
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
    <h1 class="text-4xl text-white tracking-tighter">Chess Openings Memory</h1>
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
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" v-for="suggestion in suggestions" @click="selectSuggestion(suggestion, $event)" :disabled="roundEnded" :class="{ correct: currentOpening.name === suggestion && roundEnded }">
          {{ suggestion }}
        </button>
      </div>
      <h2 class="spoiler" @click="toggleSpoiler" v-if="isDevMode">{{ currentOpening.name }}</h2>
    </aside>
  </main>
</template>

<style scoped>
@reference "./assets/base.css";

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
      width: 45%;
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
  @apply bg-green-700 hover:bg-green-800
}

.invalid {
  @apply bg-red-700 hover:bg-red-800
}

button:disabled,
button[disabled]{
  color: var(--color-text);
}
</style>
