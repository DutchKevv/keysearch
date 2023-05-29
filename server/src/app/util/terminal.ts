import ProgressBar from "progress"

export function showProgressBar(total: number, name: string, applyInterval = false): ProgressBar {
    var bar = new ProgressBar(`${name} [:bar] :percent :etas`, {
        complete: '=',
        incomplete: ' ',
        width: 50,
        total
    });


    if (applyInterval) {
        var timer = setInterval(function () {
            bar.tick();

            if (bar.complete) {
                clearInterval(timer);
            }
        }, 1000);
    }


    return bar
}