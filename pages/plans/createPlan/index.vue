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
                <v-btn
                  text
                  color="primary"
                  @click="$refs.menu.save(date)"
                >OK</v-btn>
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
              @save="save"
              @cancel="cancel"
              @close="close"
            >
              <div>{{ props.item.passage }}</div>   <!-- original content -->
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
        <br />
      </v-container>
      <v-btn @click="submitPlan" color="success">Create Plan</v-btn>
      <v-btn @click="cancelPlan" color="error">Cancel</v-btn>
    </v-form>
  </div>
</template>

<script>
export default {
  middleware: ["loginCheck"],
  data() {
    return {
      valid: false,
      planName: "",
      nameRules: [
        v => !!v || "Name is required",
        v => v.length <= 10 || "Name must be less than 10 characters"
      ],
      description: "",
      descriptionRules: [v => !!v || "Description is required"],
      initialTADescription: "A simple description of your plan",
      initialTARows: "1",
      date: new Date().toISOString().substr(0, 7),
      menu: false,
      height: 300,
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
      snack: false,
      snackColor: "",
      snackText: "",
      tempStore: {}
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
    close() {
      console.log("Dialog closed");
    },
    createPlan() {
      this.$store.dispatch("planStore/createPlan");
      this.$router.push("/");
    },
    submitPlan() {
      console.log("Plan submitted");
    },
    cancelPlan() {
      console.log("Plan cancelled");
    },
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
      console.log("What is currentDate : " + currentDate);
      console.log("What is current Month Passages : " + currentMonthPassages);
      this.tempStore[currentDate] = currentMonthPassages;
      console.log(
        "Stored Month Passages with this key : " + this.tempStore[currentDate]
      );
    }
  },
  computed: {
    displayMonthInUTCFormat() {
      // Needed because Date Picker requires ISO format from model
      let newDate = new Date(this.date).toUTCString().substr(8, 8);
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
        console.log("Makes new Month");
        let currentMonthPassages = [];
        for (let i = 1; i <= this.numDaysInMonth; i++) {
          currentMonthPassages.push({
            day: i,
            passage: "-- Enter Passage --"
          });
        }
        return currentMonthPassages;
      } else {
        console.log("Does it try to load old data? ");
        return this.tempStore[this.date];
      }
    }
  }
};
</script>