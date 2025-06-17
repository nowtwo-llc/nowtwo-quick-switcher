/**
 * Statistic Module
 * Tracks and manages usage statistics with time-based scoring.
 * Implements a scoring system based on frequency and recency of usage,
 * inspired by Slack's quick switcher algorithm.
 */
define('tracker/statistic', function() {
    /**
     * Get current Unix timestamp in seconds
     * @returns {number} Current timestamp in seconds
     */
    const time = () => {
        return Math.floor(new Date().getTime() / 1000);
    };

    /**
     * Statistic object for tracking usage patterns
     * Maintains a list of timestamps and count of occurrences
     */
    const Statistic = {
        /**
         * Create a new Statistic instance
         * @param {Object} [data] - Optional data to initialize the statistic
         * @param {Array} [data.timestamps] - Array of previous timestamps
         * @param {number} [data.count] - Previous count
         * @returns {Object} New Statistic instance
         */
        create(data) {
            const stat = Object.create(Statistic);
            stat.init(data);

            return stat;
        },

        /**
         * Initialize the statistic with optional data
         * @param {Object} [data] - Optional data to initialize with
         */
        init(data) {
            if (data) {
                this.timestamps = data.timestamps;
                this.count = data.count;
                return;
            }

            this.timestamps = [];
            this.count = 0;
        },

        /**
         * Increment the statistic count and add current timestamp
         * Maintains a maximum of 10 timestamps by removing oldest entries
         */
        increment() {
            this.timestamps.push(time());
            ++this.count;

            // Keep only the 10 most recent timestamps
            while (this.timestamps.length > 10) {
                this.timestamps.shift();
            }
        },

        /**
         * Calculate the score based on frequency and recency
         * Uses a weighted scoring system based on time windows:
         * - Last 4 hours: 100 points
         * - Last 24 hours: 80 points
         * - Last 3 days: 60 points
         * - Last week: 40 points
         * - Last month: 20 points
         * - Last 3 months: 10 points
         * 
         * @returns {number} Calculated score
         */
        score() {
            if (!this.timestamps.length) {
                return 0;
            }

            const now = time();

            /**
             * Scoring based on weights and calculation used by Slack as
             * described in their article:
             * https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60#.cb5ofyxyl
             */
            const score = this.timestamps.reduce(
                (score, timestamp) => {
                    // Last 4 hours: highest weight
                    if (timestamp > now - (3600 * 4)) {
                        return score + 100;
                    }

                    // Last 24 hours: high weight
                    if (timestamp > now - (3600 * 24)) {
                        return score + 80;
                    }

                    // Last 3 days: medium-high weight
                    if (timestamp > now - (3600 * 24 * 3)) {
                        return score + 60;
                    }

                    // Last week: medium weight
                    if (timestamp > now - (3600 * 7)) {
                        return score + 40;
                    }

                    // Last month: medium-low weight
                    if (timestamp > now - (3600 * 30)) {
                        return score + 20;
                    }

                    // Last 3 months: low weight
                    if (timestamp > now - (3600 * 90)) {
                        return score + 10;
                    }

                    return score;
                },
                0
            );

            // Final score is the average score per timestamp multiplied by total count
            return this.count * score / this.timestamps.length;
        },
    };

    return Statistic;
});
