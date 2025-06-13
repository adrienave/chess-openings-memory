<script setup lang="ts">
import {BoardApi, BoardConfig, TheChessboard} from 'vue3-chessboard';
import 'vue3-chessboard/style.css';
import 'flag-icons/css/flag-icons.min.css';
import { ref, reactive, onMounted, Ref, Reactive } from 'vue';
import { Opening, openings } from '@/data/openings';
import translations from '@/data/translations.json';

import * as _ from "lodash";
import { I18n } from "i18n-js";

const i18n = ref(new I18n(translations));
i18n.value.locale = "en";

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
const traitImagePath = ref("");
const eligibleOpenings = [...openings]

const refreshTurnColor = () => {
  turnColor.value = boardAPI?.getTurnColor();
  if (turnColor.value) {
    traitImagePath.value = `url("${computeKingImage()}")`;
  }
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

const computeKingImage = () => {
  return new URL(`./assets/images/${turnColor.value}_king.svg`, import.meta.url).href;
}

const changeLanguage = (language: string) => {
  i18n.value.locale = language;
}

onMounted(() => {
  refreshTurnColor();
});
</script>

<template>
  <div class="min-md:hidden fixed top-0 end-0">
    <span class="fi fi-fr mr-2 cursor-pointer" @click="changeLanguage('fr')"></span>
    <span class="fi fi-gb mr-2 cursor-pointer" @click="changeLanguage('en')"></span>
  </div>

  <div class="max-sm:hidden fixed top-0 end-0">
    <button class="language" @click="changeLanguage('fr')"><span class="fi fi-fr mr-2"></span>French</button>
    <button class="language" @click="changeLanguage('en')"><span class="fi fi-gb mr-2"></span>English</button>
  </div>

  <header class="max-w-[90%]">
    <h1 class="text-3xl md:text-5xl mb-2 md:mb-4 tracking-tighter">{{ i18n.t("appTitle") }}</h1>
  </header>

  <main class="md:flex">
    <div class="md:shrink-0">
      <TheChessboard id="chessboard" :board-config="boardConfig" @board-created="(api) => {
        boardAPI = api;
      }" reactive-config />
      <p class="text-xs">{{ boardConfig.fen }}</p>
    </div>
    <aside class="sm:w-100 md:w-200 md:ml-8 border-2 border-solid rounded p-4 bg-gray-700 border-gray-600 m-auto h-fit">
      <h2 class="text-4xl pb-2 md:pb-4">{{ i18n.t("score").toUpperCase() }} - {{ points }} / {{ round }}</h2>
      <p class="text-xl float-right capitalize">{{ i18n.t("difficulty") }} - <img v-for="_ in currentOpening.difficulty" src="./assets/images/star.png" width="32" height="32" alt="Star" class="inline align-text-top" /></p>
      <p class="text-xl capitalize relative trait">{{ i18n.t("trait", { "color": i18n.t(turnColor) }) }}</p>
      <div id="suggestions" class="md:flex md:flex-wrap mt-10">
        <button v-for="suggestion in suggestions" @click="selectSuggestion(suggestion, $event)" :disabled="roundEnded" :class="{ correct: currentOpening.name === suggestion && roundEnded }">
          {{ suggestion }}
        </button>
      </div>
      <h2 class="spoiler" @click="toggleSpoiler" v-if="isDevMode">{{ currentOpening.name }}</h2>
    </aside>
  </main>
</template>

<style scoped>
@reference "./assets/base.css";

* {
  @apply text-white;
}

button {
  @apply bg-blue-500 hover:bg-blue-700 py-2 px-2 m-1 sm:m-2 w-90 rounded text-2xl cursor-pointer;
}

.language {
  @apply w-50;
}

aside {
  #suggestions {
    button {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
}

.spoiler {
  @apply bg-white;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
}

.trait::before {
  background-image: v-bind(traitImagePath);
  background-size: 30px;
  width: 30px;
  height: 30px;
  content: "";
  @apply inline-block mr-1 md:mr-2 align-bottom;
}

.correct {
  @apply bg-green-700 hover:bg-green-800
}

.invalid {
  @apply bg-red-700 hover:bg-red-800
}

button:disabled,
button[disabled] {
  @apply text-gray-300;
}
</style>
