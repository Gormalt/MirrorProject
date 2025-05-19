// ScoreManager.js - Handles score management and persistence

class ScoreManager {
    constructor(config) {
        this.fs = require('fs');
        this.config = config;
        this.scores = require(config.paths.scores);
    }

    // Get all scores
    getScores() {
        return this.scores;
    }

    // Add a new score and return updated list
    setScore(score) {
        let nextScore = score;
        // Limit name to 3 characters
        nextScore.name = nextScore.name.slice(0, 3);
        let temp = {};

        // Insert score in sorted order
        for (let i = 0; i < this.scores.length; i++) {
            if (this.scores[i].score < parseInt(nextScore.score)) {
                temp = this.scores[i];
                this.scores[i] = nextScore;
                nextScore = temp;
            }
        }

        // Save to file
        this.saveScores();
        return this.scores;
    }

    // Save scores to file
    saveScores() {
        const json = JSON.stringify(this.scores);
        this.fs.writeFileSync(this.config.paths.scores, json, 'utf8');
    }

}

module.exports = ScoreManager;
