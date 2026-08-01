/**
 * Statistic
 *
 * Tracks usage of a single item with time-based scoring. Implements the
 * frequency/recency weighting described by Slack's quick switcher write-up:
 * https://slack.engineering/a-faster-smarter-quick-switcher-77cbc193cb60
 */

/** Maximum number of timestamps retained per statistic. */
const MAX_TIMESTAMPS = 10;

/**
 * Time windows, most recent first, paired with the points they award.
 * Durations are in seconds.
 */
const SCORE_WINDOWS = [
    {duration: 3600 * 4, points: 100},
    {duration: 3600 * 24, points: 80},
    {duration: 3600 * 24 * 3, points: 60},
    {duration: 3600 * 24 * 7, points: 40},
    {duration: 3600 * 24 * 30, points: 20},
    {duration: 3600 * 24 * 90, points: 10},
];

/**
 * Current unix timestamp in seconds.
 *
 * @returns {number} Seconds since the epoch.
 */
const time = () => Math.floor(Date.now() / 1000);

export const Statistic = {
    /**
     * Create a new Statistic instance.
     *
     * @param {Object} [data] - Previously persisted data to rehydrate from.
     * @param {number[]} [data.timestamps] - Previous selection timestamps.
     * @param {number} [data.count] - Total number of selections.
     * @returns {Object} A new Statistic instance.
     */
    create(data) {
        const stat = Object.create(Statistic);
        stat.init(data);

        return stat;
    },

    /**
     * Initialize the statistic, tolerating partial or malformed stored data.
     *
     * @param {Object} [data] - Previously persisted data to rehydrate from.
     */
    init(data) {
        this.timestamps = [];
        this.count = 0;

        if (!data) {
            return;
        }

        if (Array.isArray(data.timestamps)) {
            this.timestamps = data.timestamps.filter(
                (timestamp) => typeof timestamp === 'number'
                    && Number.isFinite(timestamp)
            );
        }

        if (typeof data.count === 'number' && Number.isFinite(data.count)) {
            this.count = data.count;
        }
    },

    /**
     * Record a selection, retaining only the most recent timestamps.
     */
    increment() {
        this.timestamps.push(time());
        ++this.count;

        while (this.timestamps.length > MAX_TIMESTAMPS) {
            this.timestamps.shift();
        }
    },

    /**
     * Score this statistic by frequency and recency. The average points per
     * retained timestamp are multiplied by the lifetime selection count, so
     * an item selected often and recently outranks one selected often but
     * long ago.
     *
     * @returns {number} The calculated score, or 0 when never selected.
     */
    score() {
        if (!this.timestamps.length) {
            return 0;
        }

        const now = time();

        const score = this.timestamps.reduce((total, timestamp) => {
            const window = SCORE_WINDOWS.find(
                (candidate) => timestamp > now - candidate.duration
            );

            return total + (window ? window.points : 0);
        }, 0);

        return this.count * score / this.timestamps.length;
    },
};

export default Statistic;
