<script setup lang="ts">
import { TheChessboard } from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import { ref, reactive } from 'vue';
import { openings } from '@/data/openings.ts';
import _ from "lodash";

const DELAY_BETWEEN_ROUNDS_MS = 500;

const currentOpening: Opening = ref({});
const suggestions: string[] = ref([]);
const boardConfig = reactive({
  viewOnly: true
});
const points: number = ref(0);
const round: number = ref(0);
const roundStarted: boolean = ref(true);

const pickOpening = () => {
  let newOpening;
  do {
    newOpening = _.sample(openings);
  } while (newOpening.fen === currentOpening.value.fen)

  currentOpening.value = newOpening
  boardConfig.fen = currentOpening.value.fen;

  suggestions.value = [currentOpening.value.name];
  while (suggestions.value.length < 4) {
    let suggestedOpening = _.sample(openings);
    if (!suggestions.value.includes(suggestedOpening.name)) {
      suggestions.value.push(suggestedOpening.name)
    }
  }
  suggestions.value = _.shuffle(suggestions.value);
  roundStarted.value = true;
}

const resetSuggestionBackground = (suggestionElement: HTMLElement) => {
  suggestionElement.classList.remove('correct');
  suggestionElement.classList.remove('invalid');
}

const selectSuggestion = (suggestion, event: Event) => {
  const suggestionElement = event.target;
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

const toggleSpoiler = (event) => {
  event.target.classList.toggle('spoiler');
}
</script>

<template>
  <header>
    <h1>Chess Openings Memory</h1>
  </header>

  <main>
    <div>
      <TheChessboard id="chessboard" :board-config="boardConfig" reactive-config />
      <p>{{ boardConfig.fen }}</p>
    </div>
    <aside>
      <div>Score: {{ points }} / {{ round }}</div>
      <div id="suggestions">
        <button v-for="suggestion in suggestions" @click="selectSuggestion(suggestion, $event)" :disabled="!roundStarted">
          {{ suggestion }}
        </button>
      </div>
      <h2 class="spoiler" @click="toggleSpoiler">{{currentOpening.name }}</h2>
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
