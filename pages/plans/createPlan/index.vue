<template>
  <div>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="planName"
              :rules="nameRules"
              :counter="10"
              label="Plan Name"
              required
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="8">
            <v-textarea
              v-model="description"
              :auto-grow="true"
              label="Description"
              :placeholder="initialTADescription"
              :rows="initialTARows"
              required
            ></v-textarea>
          </v-col>
        </v-row>
        <v-data-table
          :headers="headers"
          :items="dayPassage"
          dense
          fixed-header
          disable-pagination
          hide-default-footer
        >
          <template v-slot:item.passage="props">
            <v-edit-dialog
              :return-value.sync="props.item.passage"
              large
              persistent
              @save="save"
              @cancel="cancel"
              @open="open"
              @close="close"
            >
              <div>{{ props.item.passage }}</div>
              <template v-slot:input>
                <div class="mt-4 title">Enter Passage</div>
              </template>
              <template v-slot:input>
                <v-text-field
                  v-model="props.item.passage"
                  :rules="[max25chars]"
                  label="Edit"
                  single-line
                  counter
                  autofocus
                ></v-text-field>
              </template>
            </v-edit-dialog>
          </template>
        </v-data-table>

        <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
          {{ snackText }}
          <v-btn text @click="snack = false">Close</v-btn>
        </v-snackbar>
      </v-container>
    </v-form>
  </div>
</template>

<script>
export default {
  middleware: ["loginCheck"],
  data() {
    return {
      snack: false,
      snackColor: "",
      snackText: "",
      max25chars: v => v.length <= 25 || "Input too long!",
      headers: [
        {
          text: "Day of Month",
          align: "left",
          sortable: false,
          value: "day"
        },
        {
          text: "Passage",
          sortable: false,
          value: "passage"
        }
      ],
      dayPassage: [
        {
          day: "1",
          passage: "Enter Passage"
        },
        {
          day: "2",
          passage: "Enter Passage"
        },
        {
          day: "3",
          passage: "Enter Passage"
        },
        {
          day: "4",
          passage: "Enter Passage"
        },
        {
          day: "5",
          passage: "Enter Passage"
        },
        {
          day: "6",
          passage: "Enter Passage"
        },
        {
          day: "7",
          passage: "Enter Passage"
        },
        {
          day: "8",
          passage: "Enter Passage"
        },
        {
          day: "9",
          passage: "Enter Passage"
        },
        {
          day: "10",
          passage: "Enter Passage"
        },
        {
          day: "11",
          passage: "Enter Passage"
        },
        {
          day: "12",
          passage: "Enter Passage"
        },
        {
          day: "13",
          passage: "Enter Passage"
        },
        {
          day: "14",
          passage: "Enter Passage"
        },
        {
          day: "15",
          passage: "Enter Passage"
        },
        {
          day: "16",
          passage: "Enter Passage"
        },
        {
          day: "17",
          passage: "Enter Passage"
        },
        {
          day: "18",
          passage: "Enter Passage"
        },
        {
          day: "19",
          passage: "Enter Passage"
        },
        {
          day: "20",
          passage: "Enter Passage"
        },
        {
          day: "21",
          passage: "Enter Passage"
        },
        {
          day: "22",
          passage: "Enter Passage"
        },
        {
          day: "23",
          passage: "Enter Passage"
        },
        {
          day: "24",
          passage: "Enter Passage"
        },
        {
          day: "25",
          passage: "Enter Passage"
        },
        {
          day: "26",
          passage: "Enter Passage"
        },
        {
          day: "27",
          passage: "Enter Passage"
        },
        {
          day: "28",
          passage: "Enter Passage"
        },
        {
          day: "29",
          passage: "Enter Passage"
        },
        {
          day: "30",
          passage: "Enter Passage"
        },
        {
          day: "31",
          passage: "Enter Passage"
        }
      ],
      valid: false,
      planName: "",
      description: "",
      initialTADescription: "A simple description of your plan",
      initialTARows: "1",
      nameRules: [
        v => !!v || "Name is required",
        v => v.length <= 10 || "Name must be less than 10 characters"
      ]
    };
  },
  methods: {
    save() {
      this.snack = true;
      this.snackColor = "success";
      this.snackText = "Data saved";
    },
    cancel() {
      this.snack = true;
      this.snackColor = "error";
      this.snackText = "Canceled";
    },
    open() {
      this.snack = true;
      this.snackColor = "info";
      this.snackText = "Dialog opened";
    },
    close() {
      console.log("Dialog closed");
    },
    createPlan() {
      this.$store.dispatch("planStore/createPlan");
      this.$router.push("/");
    }
  }
};
</script>