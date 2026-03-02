import List "mo:core/List";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Char "mo:core/Char";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat32 "mo:core/Nat32";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

actor {
  type TimetableSlot = {
    id : Nat;
    subject : Text;
    startTime : Int;
    location : Text;
    dayOfWeek : Text;
    durationMinutes : Nat;
    createdAt : Time.Time;
  };

  module TimetableSlot {
    public func compareByStartTime(slot1 : TimetableSlot, slot2 : TimetableSlot) : Order.Order {
      Int.compare(slot1.startTime, slot2.startTime);
    };
  };

  type Task = {
    id : Nat;
    title : Text;
    dueDate : ?Time.Time;
    completed : Bool;
    description : Text;
    createdAt : Time.Time;
  };

  module Task {
    public func compareByDueDate(task1 : Task, task2 : Task) : Order.Order {
      switch (task1.dueDate, task2.dueDate) {
        case (?date1, ?date2) { Int.compare(date1, date2) };
        case (null, ?_) { #greater };
        case (?_, null) { #less };
        case (null, null) { #equal };
      };
    };
  };

  type ChatMessage = {
    id : Nat;
    sender : Text;
    content : Text;
    timestamp : Time.Time;
  };

  type SidebarItem = {
    id : Nat;
    title : Text;
    icon : Text;
    route : Text;
  };

  type DayEntry = {
    id : Nat;
    userId : Text;
    date : Int;
    taskDescription : Text;
    createdAt : Time.Time;
  };

  var nextSlotId = 1;
  var nextTaskId = 1;
  var nextMessageId = 1;
  var nextDayEntryId = 1;

  let slots = Map.empty<Nat, TimetableSlot>();
  let tasks = Map.empty<Nat, Task>();
  let chatMessages = Map.empty<Nat, ChatMessage>();
  let sidebarItems = Map.empty<Nat, SidebarItem>();
  let dayEntries = Map.empty<Nat, DayEntry>();

  public shared ({ caller }) func createSlot(subject : Text, startTime : Int, location : Text, dayOfWeek : Text, durationMinutes : Nat) : async TimetableSlot {
    let slot : TimetableSlot = {
      id = nextSlotId;
      subject;
      startTime;
      location;
      dayOfWeek;
      durationMinutes;
      createdAt = Time.now();
    };
    slots.add(nextSlotId, slot);
    nextSlotId += 1;
    slot;
  };

  public query ({ caller }) func getAllSlots() : async [TimetableSlot] {
    slots.values().toArray();
  };

  public shared ({ caller }) func deleteSlot(slotId : Nat) : async () {
    if (not slots.containsKey(slotId)) { Runtime.trap("Slot does not exist") };
    slots.remove(slotId);
  };

  public shared ({ caller }) func createTask(title : Text, dueDate : ?Time.Time, description : Text) : async Task {
    let task : Task = {
      id = nextTaskId;
      title;
      dueDate;
      completed = false;
      description;
      createdAt = Time.now();
    };
    tasks.add(nextTaskId, task);
    nextTaskId += 1;
    task;
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    tasks.values().toArray();
  };

  public shared ({ caller }) func markTaskAsCompleted(taskId : Nat) : async () {
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task does not exist") };
      case (?task) {
        let updatedTask : Task = {
          task with
          completed = true;
        };
        tasks.add(taskId, updatedTask);
      };
    };
  };

  public shared ({ caller }) func sendMessage(sender : Text, content : Text) : async ChatMessage {
    let message : ChatMessage = {
      id = nextMessageId;
      sender;
      content;
      timestamp = Time.now();
    };
    chatMessages.add(nextMessageId, message);
    nextMessageId += 1;
    message;
  };

  public query ({ caller }) func getAllMessages() : async [ChatMessage] {
    chatMessages.values().toArray();
  };

  public shared ({ caller }) func addSidebarItem(title : Text, icon : Text, route : Text) : async SidebarItem {
    let item : SidebarItem = {
      id = sidebarItems.size();
      title;
      icon;
      route;
    };
    sidebarItems.add(sidebarItems.size(), item);
    item;
  };

  public query ({ caller }) func getAllSidebarItems() : async [SidebarItem] {
    sidebarItems.values().toArray();
  };

  //////////////////////////
  //// Day Tracker CRUD ////
  //////////////////////////

  /// Add a new day entry with the given details.
  /// Returns the newly created DayEntry.
  public shared ({ caller }) func addDayEntry(userId : Text, date : Int, taskDescription : Text) : async DayEntry {
    let entry : DayEntry = {
      id = nextDayEntryId;
      userId;
      date;
      taskDescription;
      createdAt = Time.now();
    };
    dayEntries.add(nextDayEntryId, entry);
    nextDayEntryId += 1;
    entry;
  };

  /// Get all day entries for a specific user.
  public query ({ caller }) func getDayEntries(userId : Text) : async [DayEntry] {
    let entries : [DayEntry] = dayEntries.values().toArray();
    entries.filter(
      func(entry) {
        entry.userId == userId;
      }
    );
  };

  /// Get day entries for a user within a specific date range.
  public query ({ caller }) func getDayEntriesByRange(userId : Text, startDate : Int, endDate : Int) : async [DayEntry] {
    dayEntries.values().toArray().filter(
      func(entry) {
        entry.userId == userId and (entry.date >= startDate) and (entry.date <= endDate)
      }
    );
  };

  /// Update the task description of an existing day entry.
  public shared ({ caller }) func updateDayEntry(entryId : Nat, newDescription : Text) : async DayEntry {
    switch (dayEntries.get(entryId)) {
      case (null) { Runtime.trap("Day entry does not exist") };
      case (?entry) {
        let updatedEntry : DayEntry = {
          entry with
          taskDescription = newDescription;
        };
        dayEntries.add(entryId, updatedEntry);
        updatedEntry;
      };
    };
  };

  /// Delete a day entry by its ID.
  public shared ({ caller }) func deleteDayEntry(entryId : Nat) : async () {
    if (not dayEntries.containsKey(entryId)) { Runtime.trap("Day entry does not exist") };
    dayEntries.remove(entryId);
  };
};
