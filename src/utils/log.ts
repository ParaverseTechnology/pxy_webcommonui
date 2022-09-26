export class Level {
    static INFO = 'INFO';
    static WARN = 'WARN';
    static ERR = 'ERROR';
    static TRACE = 'TRACE';

    static getLevelIndex(level: string) {
        switch(level) {
            case Level.INFO:
                return 0;
            case Level.WARN:
                return 1;
            case Level.ERR:
                return 2;
            case Level.TRACE:
                return 3;
            default:
                return 4;
        }
    }
}

export interface LogObserver {
    onLog(msg: string): void;
}

/**
 * 
 */

export default class Log {
    public static get logLevel() { return this._logLevel; }
    public static set logLevel(level: string) { this._logLevel = level.toUpperCase(); }
    static _logLevel = Level.WARN;

    static info(...info: any[]) {
        this.log(Level.INFO, ...info);
    }
    static warn(...warn: any[]) {
        this.log(Level.WARN, ...warn);
    }
    static err(...err: any[]) {
        this.log(Level.ERR, ...err);
    }
    static trace(...log: any[]) {
        this.log(Level.TRACE, ...log);
    }

    public static setObserver(ob: LogObserver) {
        this._observer = ob;
    }
    private static _observer: LogObserver | null = null;

    private static log(level: string, ...logs: any[]): void {
        const currentIndex = Level.getLevelIndex(level);
        if (currentIndex < Level.getLevelIndex(Log._logLevel)) {
            return;
        }

        const d = new Date;
        const prex = d.toLocaleTimeString() + ' [' + level + ']:';
        // jQuery('#log').append('<p>' + logs.toString() + '</p>');
        console.log("%c" + prex, "background-color: #245057; padding: 0.2rem 1.5rem; color: white;");

        switch (level) {
            case Level.INFO:
                console.info(...logs);
                break;
            case Level.WARN:
                console.warn(...logs);
                break;
            case Level.ERR:
                console.error(...logs);
                break;
            case Level.TRACE:
                console.trace(...logs);
                break;
            default:
                break;
        }

        if (this._observer) {
            this._observer.onLog(prex + logs.toString());
        }
    }
}
