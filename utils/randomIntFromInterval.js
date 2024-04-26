function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
module.exports = randomIntFromInterval;

// https://stackoverflow.com/a/7228322/22857578
