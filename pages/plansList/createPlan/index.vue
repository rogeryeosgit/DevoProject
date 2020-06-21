<template>
  <div>
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="planName"
              :rules="nameRules"
              :counter="20"
              label="Plan Name"
              required
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="4">
            <v-textarea
              v-model="description"
              :rules="descriptionRules"
              :auto-grow="true"
              label="Description"
              :placeholder="initialTADescription"
              :rows="initialTARows"
              required
            ></v-textarea>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" sm="2">
            <v-menu
              ref="menu"
              v-model="menu"
              :close-on-content-click="false"
              :return-value.sync="date"
              transition="scale-transition"
              offset-y
              max-width="290px"
              min-width="290px"
            >
              <template v-slot:activator="{ on }">
                <v-text-field
                  v-model="displayMonthInUTCFormat"
                  label="Month"
                  append-icon="mdi-calendar-month"
                  readonly
                  v-on="on"
                  @click="tempStoreMonthPassages()"
                ></v-text-field>
              </template>
              <v-date-picker v-model="date" :show-current="false" type="month" no-title scrollable>
                <v-spacer></v-spacer>
                <v-btn text color="primary" @click="menu = false">Cancel</v-btn>
                <v-btn text color="primary" @click="$refs.menu.save(date)">OK</v-btn>
              </v-date-picker>
            </v-menu>
          </v-col>
        </v-row>
        <v-data-table
          :headers="headers"
          :items="monthPassages"
          :height="height"
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
              @open="setPPID(props.item.day)"
              @save="save"
              @cancel="cancel"
              @close="close"
            >
              <div>{{ props.item.passage }}</div>
              <template v-slot:input>
                <br />
                <PassagePicker
                  :ppID="props.item.day"
                  :isCompleted="reset"
                  @stepResetDone="resetComplete"
                  v-model="props.item.passage"
                ></PassagePicker>
              </template>
            </v-edit-dialog>
          </template>
        </v-data-table>

        <v-snackbar v-model="snack" :timeout="3000" :color="snackColor">
          {{ snackText }}
          <v-btn text @click="snack = false">Close</v-btn>
        </v-snackbar>
        <br />
      </v-container>
      <v-btn @click="cancelPlan" color="error">Cancel</v-btn>
      <v-btn @click="submitPlan" color="success">Create Plan</v-btn>
    </v-form>
  </div>
</template>

<script>
import PassagePicker from "@/components/PassagePicker";

export default {
  middleware: ["checkAuth", "loginCheck"],
  data() {
    return {
      valid: false,
      planName: "",
      nameRules: [
        v => !!v || "Name is required",
        v =>
          v.length <= 20 ||
          "Name shouod be restricted to less than 20 characters"
      ],
      description: "",
      descriptionRules: [v => !!v || "Description is required"],
      initialTADescription: "A simple description of your plan",
      initialTARows: "1",
      date: new Date().toISOString().substr(0, 7),
      menu: false,
      height: 300,
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
      snack: false,
      snackColor: "",
      snackText: "",
      tempStore: {},
      submitStore: {},
      sortedSubmitStore: {},
      currentPPID: 99,
      reset: {
        resetNow: false,
        ppID: 199
      }
    };
  },
  components: {
    PassagePicker
  },
  methods: {
    setPPID(id) {
      this.currentPPID = id;
    },
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
    close() {
      // this.reset.ppID = this.currentPPID;
      // this.reset.resetNow = true;
      this.reset = Object.assign({}, this.reset, {
        ppID: this.currentPPID,
        resetNow: true
      }); // Needed for reactivity
    },
    resetComplete(id) {
      this.reset.ppID = id;
      this.reset.resetNow = false;
    },
    submitPlan() {
      var userID = this.$store.getters["userStore/getUserID"];
      this.emptyPassageExtraction();
      this.sortPassageByDate();

      // for (let [key, value] of Object.entries(this.sortedSubmitStore)) {
      //   console.log(`${key}:`);
      //   for (let [key2, value2] of Object.entries(this.sortedSubmitStore[key])) {
      //     console.log(`${key2}: ${value2}`);
      //   }
      // }

      this.$store.dispatch("planStore/createPlan", {
        creatorEmail: userID,
        planName: this.planName,
        description: this.description,
        passages: this.sortedSubmitStore
      });
      this.$router.push("/plansList");
    },
    cancelPlan() {
      this.$router.push("/plansList");
    },
    // Checking if the chosen month has any passages stored
    isTempStored() {
      try {
        if (this.tempStore[this.date]) {
          return true;
        }
      } catch {
        return false;
      }
    },
    tempStoreMonthPassages() {
      let currentDate = this.date;
      let currentMonthPassages = this.monthPassages;
      this.tempStore[currentDate] = currentMonthPassages;
    },
    // preparing for submission, get tempstore and current month
    emptyPassageExtraction() {
      var monthKey = this.displayMonthInUTCFormat;
      var object = {};
      for (var x in this.monthPassages) {
        if (this.monthPassages[x].passage !== "-- Enter Passage --") {
          var dayKey = this.monthPassages[x].day;
          object[dayKey] = this.monthPassages[x].passage;
        }
        if (Object.keys(object).length !== 0) {
          this.submitStore[monthKey] = object;
        }
      }

      var object2 = {};
      for (let [key, value] of Object.entries(this.tempStore)) {
        let convertedKey =
          new Date(key).toString().substr(4, 3) +
          " " +
          new Date(key).toString().substr(11, 4);
        for (let [key2, value2] of Object.entries(this.tempStore[key])) {
          if (this.tempStore[key][key2].passage !== "-- Enter Passage --") {
            var dayKey = this.tempStore[key][key2].day;
            object2[dayKey] = this.tempStore[key][key2].passage;
          }
        }
        if (
          !this.submitStore.hasOwnProperty(convertedKey) &&
          Object.keys(object2).length !== 0
        ) {
          this.submitStore[convertedKey] = object2;
        }
      }
    },
    // Must be done after submit store is prepared by emptyPassageExtraction()
    sortPassageByDate() {
      var sortStore = [];
      for (let i in this.submitStore) {
        sortStore.push(new Date(i));
      }

      var sortedStore = sortStore.slice().sort((a, b) => a - b);

      this.sortedSubmitStore = {};
      for (let j in sortedStore) {
        var tempKey =
          sortedStore[j].toString().substr(4, 3) +
          " " +
          sortedStore[j].toString().substr(11, 4);
        this.sortedSubmitStore[tempKey] = this.submitStore[tempKey];
      }
    }
  },
  computed: {
    displayMonthInUTCFormat() {
      // Needed because Date Picker requires ISO format from model
      let newDate =
        new Date(this.date).toString().substr(4, 3) +
        " " +
        new Date(this.date).toString().substr(11, 4);
      return newDate;
    },
    numDaysInMonth: function() {
      return new Date(
        this.date.slice(0, 4), // year
        this.date.slice(5, 7), // month
        0
      ).getDate();
    },
    monthPassages: function() {
      if (!this.isTempStored()) {
        let currentMonthPassages = [];
        for (let i = 1; i <= this.numDaysInMonth; i++) {
          currentMonthPassages.push({
            day: i,
            passage: "-- Enter Passage --"
          });
        }
        return currentMonthPassages;
      } else {
        return this.tempStore[this.date];
      }
    }
  }
};
</script>