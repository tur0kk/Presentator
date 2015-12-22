function Presentation(name) {
    if(typeof name == 'string') {
        this.name = name;
        this.files = [];
        this.slides = [];
        this.notes = [];
    }
    else if(typeof name == 'object') { // json constructor
        var presentation = name;

        // presentation variables
        this.name = presentation.name;
        this.files = presentation.files;
        this.slides = presentation.slides;
        this.notes = presentation.notes;
    }
    else {
        console.log("Presentation: wrong constructor usage");
    }
}

module.exports = Presentation;