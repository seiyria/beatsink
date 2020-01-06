
const { ipcRenderer } = require('electron');
const prompt = require('electron-prompt');


class Query {
  name;
  expanded = false;
  loading = false;
  hovering = false;
  results = [];
}

const vm = new Vue({
  el: '#app',

  data: {
    queries: {}
  },

  computed: {
    queryKeys() {
      return Object.keys(this.queries).sort();
    }
  },

  created() {
    this.load();
    this.init();
  },

  methods: {
    save() {
      localStorage.setItem('queries', JSON.stringify(this.queries || {}));
    },

    load() {
      try {
        this.queries = JSON.parse(localStorage.getItem('queries')) || {};
      } catch {
        this.queries = {};
      }

      Object.keys(this.queries).forEach(x => {
        this.queries[x] = Object.assign(new Query(), this.queries[x]);
      });
    },

    init() {
      Object.keys(this.queries).forEach(q => {
        const query = this.queries[q];
        query.expanded = false;

        this.updateQueryResults(q);
      });
    },

    createQuery() {
      prompt({
        title: 'New Query',
        label: 'What would you like to search for (separate multiple queries with a comma)?',
        inputAttrs: {
            type: 'text'
        },
        type: 'input'
      })
      .then((r) => {
        if(!r || !r.trim()) return;

        r.split(',').map(x => x.trim()).forEach(q => {
          this.addQuery(q);
        });
      })
      .catch(console.error);
    },

    addQuery(queryName) {
      const query = new Query();
      query.name = queryName;

      this.queries[queryName] = query;

      this.updateQueryResults(queryName);

      this.save();
      this.$forceUpdate();
    },

    removeQuery(query) {
      delete this.queries[query.name];

      this.save();
      this.$forceUpdate();
    },

    toggleExpand(query) {
      query.expanded = !query.expanded;

      this.$forceUpdate();
    },

    updateQueryResults(queryName) {
      if(!this.queries[queryName]) return;

      this.queries[queryName].loading = true;
      ipcRenderer.send('run-check-sync', { query: queryName });
    }
  }
});

ipcRenderer.on('check-sync-update', (event, args) => {
  if(!vm.queries[args.query]) return;

  vm.queries[args.query].results = args.allSongs;
  vm.queries[args.query].loading = false;
});