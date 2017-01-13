document.addEventListener("DOMContentLoaded", () => {

  class SearchBox {
    constructor(perPage, $el){
      this.perPage = perPage;
      this.autocompleteIndex = -1;
      this.$el = $el;
    }

    run(){
      this._focus();
      this.$el.on("focusin paste keyup", (e) => this._autocomplete(e));
    }

    _autocomplete(e){
      this._titleSelection(e);
      if (this._isReservedKey(e.keyCode)) return;
      const val = this.$el.val();
      if (val) {
        // Send request and handle appending html elements
        this._request(val, $('#withPeople').is(':checked'));
      } else {
        // There's no text in the searchbox. Clear all previous results
        this._clear();
      }
    }

    // Allow user to press enter to choose selected autocomplete element
    _titleSelection(e){
      if (e.keyCode === 13) {
        this._resetAutocompleteIndex();
        const selected = $('.selected');
        if (selected.length) {
          this._selectTitle(selected);
        } else {
          this._unfocus();
        }
      }
    }

    _selectTitle(selected){
      this.$el.val(selected.text());
      // Manually trigger keyup event to reset autocomplete results
      this.$el.keyup();
    }

    _unfocus(){
      this.emptyDropdown();
      this.$el.focusout();
    }

    // Key codes used by other key event listeners in the object
    _isReservedKey(code){
      return code === 38 || code === 40 || code === 13;
    }


    _url(searchString, withPeople){
      const timestamp = Math.floor(new Date().getTime() / 1000);
      return(
       `https://api.viki.io/v4/search.json?c=${searchString}&per_page=${this.perPage}&wit h_people=${withPeople}&app=100266a&t=${timestamp}`
      );
    }

    _clear(){
      $('#results').empty();
      $('#searchResults').empty();
    }

    _request(searchString, withPeople){
      $.ajax({
        url: this._url(searchString, withPeople),
        success: data => this._populateResults(searchString, data)
      });
    }

    _populateResults(searchString, data) {
      this._clear();
      this._fillAutocompleteMatches(searchString, data);
      this._fillMatches(data);
    }

    _fillMatches(data){
      const results = $('#results');
      let count = 0;
      for (let id in data) {
        if (data.hasOwnProperty(id)) {
          if (count === this.perPage) break;
          let item = this._itemTag(data[id]);
          results.append(item);
          count += 1;
        }
      }
      this._onMovieClick();
    }

    _onMovieClick(){
      $('.col').click(() => {
        this._resetAutocompleteIndex();
        $('#searchResults').empty();
      });
    }

    _fillAutocompleteMatches(searchString, data) {
      const results = $('#searchResults');
      const titles = this._findMatches(searchString, data);
      titles.forEach(title => {
        results.append(`<div class='titleMatch'>${title}</div>`);
      });
      this._attachClickHandler();
    }

    _attachClickHandler(){
      $('.titleMatch').click((e) => {
        this._selectTitle($(e.currentTarget));
      });
    }

    // Allow dropdown arrow navigation when $el is focused
    _focus(){
      // Focus event must be attached only once to avoid unnecessary calls.
      this.$el.one('focus', () => {
        $(document).keydown( e => {
          switch(e.which) {
              case 38: // up
                this._navigate(-1);
              break;
              case 40: // down
                this._navigate(1);
              break;
              default: return;
          }
          e.preventDefault(); // prevent the default scroll
        });
      });
    }

    _navigate(diff) {
      this.autocompleteIndex += diff;
      const cssClass = 'selected';
      var titleCollection = $(".titleMatch");
      if (this.autocompleteIndex >= titleCollection.length) {
        this.autocompleteIndex = 0;
      }
      if (this.autocompleteIndex < 0) {
        this._resetAutocompleteIndex();
        titleCollection.removeClass(cssClass);
        return;
      }
      titleCollection.removeClass(cssClass)
                     .eq(this.autocompleteIndex)
                     .addClass(cssClass);
    }

    _findMatches(searchString, data) {
      let relevants = [];
      for (let id in data) {
        if (data.hasOwnProperty(id)) {
          const title = data[id].tt;
          if (this._isMatch(title, searchString)) relevants.push(title);
        }
      }
      return relevants;
    }

    _isMatch(title, string) {
      if (string.length >= title.length) return false;
      for (let i = 0; i < string.length; i++) {
        if (title[i].toLowerCase() !== string[i].toLowerCase()) {
          return false;
        }
      }
      return true;
    }

    _itemTag(item){
      return (
        `
          <div style='background-image: url(${item.i})'
          class='col'>
          <div class='col-overlay'>
            <span class='title'>${item.tt}</span>
            <span class='sub'>
              Type: ${item.t === 'series' ? 'tv-show' : item.t}
            </span>
            <span class='sub'>Episodes: ${item.e}</span>
            <span class='sub'>Country: ${item.oc}</span>
          </div>
          </div>
        `
      );
    }

    // Assure next keydown doesn't jump results
    _resetAutocompleteIndex(){
      this.autocompleteIndex = -1;
    }
  }

  // Attach event handlers and start autocompletion
  new SearchBox(5, $("#searchbox")).run();

  $('.checkbox-wrapper').hover(() => {
    $('#tooltip').toggleClass('hidden');
  });
});
