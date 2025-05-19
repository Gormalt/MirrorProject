/**
 * Stats Logger Module for Tetris Project
 * Handles all statistics tracking and logging functionality
 */

const fs = require('fs');

class StatsLogger {
    constructor(config) {
        this.config = config;
        this.statsToday = {
            games: 0,
            users: 0,
            scoreTotal: 0
        };
        
        // Set up the daily logging interval
        this.setupDailyLogging();
    }

    /**
     * Increment the user count statistic
     */
    incrementUserCount() {
        this.statsToday.users += 1;
    }

    /**
     * Record a completed game
     * @param {number} score - The score achieved in the game
     */
    recordGameCompleted(score) {
        this.statsToday.games += 1;
        this.statsToday.scoreTotal += score;
    }

    /**
     * Get the current stats
     * @returns {Object} The current statistics
     */
    getCurrentStats() {
        return { ...this.statsToday };
    }

    /**
     * Reset the statistics counters
     */
    resetStats() {
        this.statsToday = {
            games: 0,
            users: 0,
            scoreTotal: 0
        };
    }

    /**
     * Log the current statistics to a file
     */
    logStats() {
        const d = new Date();
        const preString = d.getFullYear().toString() + '_' + 
                         (d.getMonth() + 1).toString() + '_' + 
                         d.getDate().toString() + '_' + 
                         d.getTime();
        
        console.log("Logging Daily Activities for:");
        console.log(preString);
        
        const json = JSON.stringify(this.statsToday);
        
        // Create the log directory if it doesn't exist
        if (!fs.existsSync(this.config.analytics.logDirectory)) {
            fs.mkdirSync(this.config.analytics.logDirectory, { recursive: true });
        }
        
        fs.writeFile(
            this.config.analytics.logDirectory + '/' + preString + '.json', 
            json, 
            'utf8', 
            function(err) {
                if (err) throw err;
            }
        );
        
        // Reset the stats after logging
        this.resetStats();
    }

    /**
     * Set up the interval for daily logging
     */
    setupDailyLogging() {
        setInterval(() => {
            this.logStats();
        }, this.config.analytics.dailyLogInterval);
    }
}

module.exports = StatsLogger;
