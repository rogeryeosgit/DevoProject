<template :value="value">
  <v-stepper>
    <v-stepper-items>
      <v-stepper-content v-if="currentStep === 1" step="1">
        <v-list class="sList">
          <v-list-item-group>
            <v-list-item
              @click="bookChosen(2, i);$emit('input', chosenPassage)"
              v-for="i in bible"
              :key="i.bookName"
            >
              <v-list-item-content>
                <v-list-item-title v-text="i.bookName"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-stepper-content>
      <v-stepper-content v-if="currentStep === 2" step="2">
        <v-list class="sList">
          <v-list-item-group>
            <v-list-item v-for="i in chosenBook.bookChapters" :key="i">
              <v-list-item-action>
                <v-checkbox v-model="ccSelected[i]" color="primary"></v-checkbox>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Chapter {{ i }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
        <v-btn
          v-show="show"
          @click="chapterChosen(3);$emit('input', chosenPassage)"
          color="indigo"
          fixed
          bottom
          right
          fab
          dark
        >
          <v-icon>mdi-arrow-right</v-icon>
        </v-btn>
      </v-stepper-content>
      <v-stepper-content v-if="currentStep === 3" step="3">
        <v-label>Starting Verse from {{ chosenBook.bookName }} Chapter {{ chosenChapter[0] }}</v-label>
        <v-select
          v-model="sV"
          :items="verseList(chosenChapter[0])"
          outlined
          dense
          @input="$emit('input', chosenPassage)"
        ></v-select>
        <v-label
          v-if="chosenChapter.length > 1"
        >Ending Verse from {{ chosenBook.bookName }} Chapter {{ chosenChapter[chosenChapter.length-1] }}</v-label>
        <v-label v-else>Ending Verse from {{ chosenBook.bookName }} Chapter {{ chosenChapter[0] }}</v-label>
        <v-select
          v-model="eV"
          v-if="chosenChapter.length > 1"
          :items="verseList(chosenChapter[chosenChapter.length-1])"
          outlined
          dense
          @input="$emit('input', chosenPassage)"
        ></v-select>
        <v-select
          v-model="eV"
          v-else
          :items="verseList(chosenChapter[0])"
          outlined
          dense
          @input="$emit('input', chosenPassage)"
        ></v-select>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
</template>

<script>
export default {
  props: {
    isCompleted: {
      resetNow: Boolean,
      ppID: Number
    },
    ppID: Number
  },
  data: function() {
    return {
      currentStep: 1,
      chosenBook: "",
      chosenChapter: [],
      ccSelected: [],
      sV: "Verse 1",
      eV: "Verse 1",
      bible: [
        {
          bookName: "Genesis",
          bookChapters: 50,
          bookVerses: [
            31,
            25,
            24,
            26,
            32,
            22,
            24,
            22,
            29,
            32,
            32,
            20,
            18,
            24,
            21,
            16,
            27,
            33,
            38,
            18,
            34,
            24,
            20,
            67,
            34,
            35,
            46,
            22,
            35,
            43,
            55,
            32,
            20,
            31,
            29,
            43,
            36,
            30,
            23,
            23,
            57,
            38,
            34,
            34,
            28,
            34,
            31,
            22,
            33,
            26
          ]
        },
        {
          bookName: "Exodus",
          bookChapters: 40,
          bookVerses: [
            22,
            25,
            22,
            31,
            23,
            30,
            25,
            32,
            35,
            29,
            10,
            51,
            22,
            31,
            27,
            36,
            16,
            27,
            25,
            26,
            36,
            31,
            33,
            18,
            40,
            37,
            21,
            43,
            46,
            38,
            18,
            35,
            23,
            35,
            35,
            38,
            29,
            31,
            43,
            38
          ]
        },
        {
          bookName: "Leviticus",
          bookChapters: 27,
          bookVerses: [
            17,
            16,
            17,
            35,
            19,
            30,
            38,
            36,
            24,
            20,
            47,
            8,
            59,
            57,
            33,
            34,
            16,
            30,
            37,
            27,
            24,
            33,
            44,
            23,
            55,
            46,
            34
          ]
        },
        {
          bookName: "Numbers",
          bookChapters: 36,
          bookVerses: [
            54,
            34,
            51,
            49,
            31,
            27,
            89,
            26,
            23,
            36,
            35,
            16,
            33,
            45,
            41,
            50,
            13,
            32,
            22,
            29,
            35,
            41,
            30,
            25,
            18,
            65,
            23,
            31,
            40,
            16,
            54,
            42,
            56,
            29,
            34,
            13
          ]
        },
        {
          bookName: "Deuteronomy",
          bookChapters: 34,
          bookVerses: [
            46,
            37,
            29,
            49,
            33,
            25,
            26,
            20,
            29,
            22,
            32,
            32,
            18,
            29,
            23,
            22,
            20,
            22,
            21,
            20,
            23,
            30,
            25,
            22,
            19,
            19,
            26,
            68,
            29,
            20,
            30,
            52,
            29,
            12
          ]
        },
        {
          bookName: "Joshua",
          bookChapters: 24,
          bookVerses: [
            18,
            24,
            17,
            24,
            15,
            27,
            26,
            35,
            27,
            43,
            23,
            24,
            33,
            15,
            63,
            10,
            18,
            28,
            51,
            9,
            45,
            34,
            16,
            33
          ]
        },
        {
          bookName: "Judges",
          bookChapters: 21,
          bookVerses: [
            36,
            23,
            31,
            24,
            31,
            40,
            25,
            35,
            57,
            18,
            40,
            15,
            25,
            20,
            20,
            31,
            13,
            31,
            30,
            48,
            25
          ]
        },
        {
          bookName: "Ruth",
          bookChapters: 4,
          bookVerses: [22, 23, 18, 22]
        },
        {
          bookName: "1 Samuel",
          bookChapters: 31,
          bookVerses: [
            28,
            36,
            21,
            22,
            12,
            21,
            17,
            22,
            27,
            27,
            15,
            25,
            23,
            52,
            35,
            23,
            58,
            30,
            24,
            42,
            15,
            23,
            29,
            22,
            44,
            25,
            12,
            25,
            11,
            31,
            13
          ]
        },
        {
          bookName: "2 Samuel",
          bookChapters: 24,
          bookVerses: [
            27,
            32,
            39,
            12,
            25,
            23,
            29,
            18,
            13,
            19,
            27,
            31,
            39,
            33,
            37,
            23,
            29,
            33,
            43,
            26,
            22,
            51,
            39,
            25
          ]
        },
        {
          bookName: "1 Kings",
          bookChapters: 22,
          bookVerses: [
            53,
            46,
            28,
            34,
            18,
            38,
            51,
            66,
            28,
            29,
            43,
            33,
            34,
            31,
            34,
            34,
            24,
            46,
            21,
            43,
            29,
            53
          ]
        },
        {
          bookName: "2 Kings",
          bookChapters: 25,
          bookVerses: [
            18,
            25,
            27,
            44,
            27,
            33,
            20,
            29,
            37,
            36,
            21,
            21,
            25,
            29,
            38,
            20,
            41,
            37,
            37,
            21,
            26,
            20,
            37,
            20,
            30
          ]
        },
        {
          bookName: "1 Chronicles",
          bookChapters: 29,
          bookVerses: [
            54,
            55,
            24,
            43,
            26,
            81,
            40,
            40,
            44,
            14,
            47,
            40,
            14,
            17,
            29,
            43,
            27,
            17,
            19,
            8,
            30,
            19,
            32,
            31,
            31,
            32,
            34,
            21,
            30
          ]
        },
        {
          bookName: "2 Chronicles",
          bookChapters: 36,
          bookVerses: [
            17,
            18,
            17,
            22,
            14,
            42,
            22,
            18,
            31,
            19,
            23,
            16,
            22,
            15,
            19,
            14,
            19,
            34,
            11,
            37,
            20,
            12,
            21,
            27,
            28,
            23,
            9,
            27,
            36,
            27,
            21,
            33,
            25,
            33,
            27,
            23
          ]
        },
        {
          bookName: "Ezra",
          bookChapters: 10,
          bookVerses: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44]
        },
        {
          bookName: "Nehemiah",
          bookChapters: 13,
          bookVerses: [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31]
        },
        {
          bookName: "Esther",
          bookChapters: 10,
          bookVerses: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3]
        },
        {
          bookName: "Job",
          bookChapters: 42,
          bookVerses: [
            22,
            13,
            26,
            21,
            27,
            30,
            21,
            22,
            35,
            22,
            20,
            25,
            28,
            22,
            35,
            22,
            16,
            21,
            29,
            29,
            34,
            30,
            17,
            25,
            6,
            14,
            23,
            28,
            25,
            31,
            40,
            22,
            33,
            37,
            16,
            33,
            24,
            41,
            30,
            24,
            34,
            17
          ]
        },
        {
          bookName: "Psalms",
          bookChapters: 150,
          bookVerses: [
            6,
            12,
            8,
            8,
            12,
            10,
            17,
            9,
            20,
            18,
            7,
            9,
            20,
            18,
            7,
            8,
            6,
            7,
            5,
            11,
            15,
            50,
            14,
            9,
            13,
            31,
            6,
            10,
            22,
            12,
            14,
            9,
            11,
            12,
            24,
            11,
            22,
            22,
            28,
            12,
            40,
            22,
            13,
            17,
            13,
            11,
            5,
            26,
            17,
            11,
            9,
            14,
            20,
            23,
            19,
            9,
            6,
            7,
            23,
            13,
            11,
            11,
            17,
            12,
            8,
            12,
            11,
            10,
            13,
            20,
            7,
            35,
            36,
            5,
            24,
            20,
            28,
            23,
            10,
            12,
            20,
            72,
            13,
            19,
            16,
            8,
            18,
            12,
            13,
            17,
            7,
            18,
            52,
            17,
            16,
            15,
            5,
            23,
            11,
            13,
            12,
            9,
            9,
            5,
            8,
            28,
            22,
            35,
            45,
            48,
            43,
            13,
            31,
            7,
            10,
            10,
            9,
            8,
            18,
            19,
            2,
            29,
            176,
            7,
            8,
            9,
            4,
            8,
            5,
            6,
            5,
            6,
            8,
            8,
            3,
            18,
            3,
            3,
            21,
            26,
            9,
            8,
            24,
            13,
            10,
            7,
            12,
            15,
            21,
            10,
            20,
            14,
            9,
            6
          ]
        },
        {
          bookName: "Proverbs",
          bookChapters: 31,
          bookVerses: [
            33,
            22,
            35,
            27,
            23,
            35,
            27,
            36,
            18,
            32,
            31,
            28,
            25,
            35,
            33,
            33,
            28,
            24,
            29,
            30,
            31,
            29,
            35,
            34,
            28,
            28,
            27,
            28,
            27,
            33,
            31
          ]
        },
        {
          bookName: "Ecclesiastes",
          bookChapters: 12,
          bookVerses: [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14]
        },
        {
          bookName: "Song of Songs",
          bookChapters: 8,
          bookVerses: [17, 17, 11, 16, 16, 13, 13, 14]
        },
        {
          bookName: "Isaiah",
          bookChapters: 66,
          bookVerses: [
            31,
            22,
            26,
            6,
            30,
            13,
            25,
            22,
            21,
            34,
            16,
            6,
            22,
            32,
            9,
            14,
            14,
            7,
            25,
            6,
            17,
            25,
            18,
            23,
            12,
            21,
            13,
            29,
            24,
            33,
            9,
            20,
            24,
            17,
            10,
            22,
            38,
            22,
            8,
            31,
            29,
            25,
            28,
            28,
            25,
            13,
            15,
            22,
            26,
            11,
            23,
            15,
            12,
            17,
            13,
            12,
            21,
            14,
            21,
            22,
            11,
            12,
            19,
            12,
            25,
            24
          ]
        },
        {
          bookName: "Jeremiah",
          bookChapters: 52,
          bookVerses: [
            19,
            37,
            25,
            31,
            31,
            30,
            34,
            22,
            26,
            25,
            23,
            17,
            27,
            22,
            21,
            21,
            27,
            23,
            15,
            18,
            14,
            30,
            40,
            10,
            38,
            24,
            22,
            17,
            32,
            24,
            40,
            44,
            26,
            22,
            19,
            32,
            21,
            28,
            18,
            16,
            18,
            22,
            13,
            30,
            5,
            28,
            7,
            47,
            39,
            46,
            64,
            34
          ]
        },
        {
          bookName: "Lamentations",
          bookChapters: 5,
          bookVerses: [22, 22, 66, 22, 22]
        },
        {
          bookName: "Ezekiel",
          bookChapters: 48,
          bookVerses: [
            28,
            10,
            27,
            17,
            17,
            14,
            27,
            18,
            11,
            22,
            25,
            28,
            23,
            23,
            8,
            63,
            24,
            32,
            14,
            49,
            32,
            31,
            49,
            27,
            17,
            21,
            36,
            26,
            21,
            26,
            18,
            32,
            33,
            31,
            15,
            38,
            28,
            23,
            29,
            49,
            26,
            20,
            27,
            31,
            25,
            24,
            23,
            35
          ]
        },
        {
          bookName: "Daniel",
          bookChapters: 12,
          bookVerses: [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13]
        },
        {
          bookName: "Hosea",
          bookChapters: 14,
          bookVerses: [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9]
        },
        {
          bookName: "Joel",
          bookChapters: 3,
          bookVerses: [20, 32, 21]
        },
        {
          bookName: "Amos",
          bookChapters: 9,
          bookVerses: [15, 16, 15, 13, 27, 14, 17, 14, 15]
        },
        {
          bookName: "Obadiah",
          bookChapters: 1,
          bookVerses: [21]
        },
        {
          bookName: "Jonah",
          bookChapters: 4,
          bookVerses: [17, 10, 10, 11]
        },
        {
          bookName: "Micah",
          bookChapters: 7,
          bookVerses: [16, 13, 12, 13, 15, 16, 20]
        },
        {
          bookName: "Nahum",
          bookChapters: 3,
          bookVerses: [15, 13, 19]
        },
        {
          bookName: "Habakkuk",
          bookChapters: 3,
          bookVerses: [17, 20, 19]
        },
        {
          bookName: "Zephaniah",
          bookChapters: 3,
          bookVerses: [18, 15, 20]
        },
        {
          bookName: "Haggai",
          bookChapters: 2,
          bookVerses: [15, 23]
        },
        {
          bookName: "Zechariah",
          bookChapters: 14,
          bookVerses: [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21]
        },
        {
          bookName: "Malachi",
          bookChapters: 4,
          bookVerses: [14, 17, 18, 6]
        },
        {
          bookName: "Matthew",
          bookChapters: 28,
          bookVerses: [
            25,
            23,
            17,
            25,
            48,
            34,
            29,
            34,
            38,
            42,
            30,
            50,
            58,
            36,
            39,
            28,
            27,
            35,
            30,
            34,
            46,
            46,
            39,
            51,
            46,
            75,
            66,
            20
          ]
        },
        {
          bookName: "Mark",
          bookChapters: 16,
          bookVerses: [
            45,
            28,
            35,
            41,
            43,
            56,
            37,
            38,
            50,
            52,
            33,
            44,
            37,
            72,
            47,
            20
          ]
        },
        {
          bookName: "Luke",
          bookChapters: 24,
          bookVerses: [
            80,
            52,
            38,
            44,
            39,
            49,
            50,
            56,
            62,
            42,
            54,
            59,
            35,
            35,
            32,
            31,
            37,
            43,
            48,
            47,
            38,
            71,
            56,
            53
          ]
        },
        {
          bookName: "John",
          bookChapters: 21,
          bookVerses: [
            51,
            25,
            36,
            54,
            47,
            71,
            53,
            59,
            41,
            42,
            57,
            50,
            38,
            31,
            27,
            33,
            26,
            40,
            42,
            31,
            25
          ]
        },
        {
          bookName: "Acts",
          bookChapters: 28,
          bookVerses: [
            26,
            47,
            26,
            37,
            42,
            15,
            16,
            40,
            43,
            48,
            30,
            25,
            52,
            28,
            41,
            40,
            34,
            28,
            41,
            38,
            40,
            30,
            35,
            27,
            27,
            32,
            44,
            31
          ]
        },
        {
          bookName: "Romans",
          bookChapters: 16,
          bookVerses: [
            32,
            29,
            31,
            25,
            21,
            23,
            25,
            39,
            33,
            21,
            36,
            21,
            14,
            23,
            33,
            27
          ]
        },
        {
          bookName: "1 Corinthians",
          bookChapters: 16,
          bookVerses: [
            31,
            16,
            23,
            21,
            13,
            20,
            40,
            13,
            27,
            33,
            34,
            31,
            13,
            40,
            58,
            24
          ]
        },
        {
          bookName: "2 Corinthians",
          bookChapters: 13,
          bookVerses: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
        },
        {
          bookName: "Galatians",
          bookChapters: 6,
          bookVerses: [24, 21, 29, 31, 26, 18]
        },
        {
          bookName: "Ephesians",
          bookChapters: 6,
          bookVerses: [23, 22, 21, 32, 33, 24]
        },
        {
          bookName: "Philippians",
          bookChapters: 4,
          bookVerses: [30, 30, 21, 23]
        },
        {
          bookName: "Colossians",
          bookChapters: 4,
          bookVerses: [29, 23, 25, 18]
        },
        {
          bookName: "1 Thessalonians",
          bookChapters: 5,
          bookVerses: [10, 20, 13, 18, 28]
        },
        {
          bookName: "2 Thessalonians",
          bookChapters: 3,
          bookVerses: [12, 17, 18]
        },
        {
          bookName: "1 Timothy",
          bookChapters: 6,
          bookVerses: [20, 15, 16, 16, 25, 21]
        },
        {
          bookName: "2 Timothy",
          bookChapters: 4,
          bookVerses: [18, 26, 17, 22]
        },
        {
          bookName: "Titus",
          bookChapters: 3,
          bookVerses: [16, 15, 15]
        },
        {
          bookName: "Philemon",
          bookChapters: 1,
          bookVerses: [25]
        },
        {
          bookName: "Hebrews",
          bookChapters: 13,
          bookVerses: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25]
        },
        {
          bookName: "James",
          bookChapters: 5,
          bookVerses: [27, 26, 18, 17, 20]
        },
        {
          bookName: "1 Peter",
          bookChapters: 5,
          bookVerses: [25, 25, 22, 19, 14]
        },
        {
          bookName: "2 Peter",
          bookChapters: 3,
          bookVerses: [21, 22, 18]
        },
        {
          bookName: "1 John",
          bookChapters: 5,
          bookVerses: [10, 29, 24, 21, 21]
        },
        {
          bookName: "2 John",
          bookChapters: 1,
          bookVerses: [13]
        },
        {
          bookName: "3 John",
          bookChapters: 1,
          bookVerses: [14]
        },
        {
          bookName: "Jude",
          bookChapters: 1,
          bookVerses: [25]
        },
        {
          bookName: "Revelation",
          bookChapters: 22,
          bookVerses: [
            20,
            29,
            22,
            11,
            14,
            17,
            17,
            13,
            21,
            11,
            19,
            17,
            18,
            20,
            8,
            21,
            18,
            24,
            21,
            15,
            27,
            21
          ]
        }
      ]
    };
  },
  methods: {
    bookChosen(nextStep, book) {
      this.currentStep = nextStep;
      this.chosenBook = book;
    },
    chapterChosen(nextStep) {
      this.currentStep = nextStep;
      this.chosenChapter.splice(0, this.chosenChapter.length);
      for (let i in this.ccSelected) {
        if (this.ccSelected[i] === true) {
          this.chosenChapter.push(i);
        }
      }
    },
    verseList(n) {
      let returnList = [];
      for (let x = 1; x <= this.chosenBook.bookVerses[n - 1]; x++) {
        returnList.push("Verse " + x);
      }
      return returnList;
    },
    passageCompleted() {
      if (this.isCompleted.ppID === this.ppID) {
        for (let i in this.ccSelected) {
          if (this.ccSelected[i] === true) {
            this.ccSelected[i] = false;
          }
        }
        this.sV = "Verse 1";
        this.eV = "Verse 1";
        this.chosenChapter.splice(0, this.chosenChapter.length);
        this.currentStep = 1;
        console.log("-- PassagePicker Reset Done --");
        this.$emit("stepResetDone", this.ppID);
      }
    }
  },
  watch: {
    chosenPassage: function() {
      console.log(this.chosenPassage);
    },
    isCompleted: function() {
      this.passageCompleted();
    }
  },
  computed: {
    show: function() {
      let checker = 0;
      for (let i in this.ccSelected) {
        if (this.ccSelected[i] === true) {
          checker++;
        }
      }
      if (checker > 0) {
        return true;
      } else {
        return false;
      }
    },
    chosenPassage: function() {
      // To structure returned passage properly, need to check if verses are not contiguous / validation of some sort
      var startC;
      var endC;

      if (this.chosenChapter.length > 1) {
        startC = this.chosenChapter[0];
        endC = this.chosenChapter[this.chosenChapter.length - 1];
      } else if (this.chosenChapter.length === 1) {
        startC = this.chosenChapter[0];
        endC = startC;
      } else {
        startC = 1;
        endC = 1;
      }

      var returnPassage =
        this.chosenBook.bookName +
        " " +
        startC +
        ":" +
        this.sV.substr(6) +
        "-" +
        endC +
        ":" +
        this.eV.substr(6);
      return returnPassage;
    }
  }
};
</script>

<style scoped>
.sList {
  height: 60vh;
  overflow-y: auto;
}
</style>