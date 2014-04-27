angular.module('ionicApp.filters', [])

.filter('date', function(){
    return function(date) {
        if (date && typeof(date.format) !== 'function') {
            date = moment(date);
        }
        return date ? date.format("DD/MM/YYYY") : ' - ';
    };
})

.filter('time', function(){
    return function(date) {
        if (date && typeof(date.format) !== 'function') {
            date = moment(date);
        }
        return date ? date.format("HH:mm:ss") : ' - ';
    };
})

.filter('datetime', function(){
    return function(date) {
        if (date && typeof(date.format) !== 'function') {
            date = moment(date);
        }
        return date ? date.format("YYYY-MM-DD HH:mm:ss") : ' - ';
    };
})

.filter('duration', function(){
    return function(duration) {
        if (duration && typeof(duration.format) !== 'function') {
            duration = moment.duration(duration);
        }
        return duration ? duration.humanize() : ' - ';
    };
})

.filter('seconds', function(){
    return function(duration) {
        if (duration && typeof(duration.format) !== 'function') {
            duration = moment.duration(duration);
        }
        return duration ? duration.asSeconds() : ' - ';
    };
});