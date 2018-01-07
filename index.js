const stream = require('stream');
const childProcess = require('child_process');

const pty = require('pty.js');

class Hyper {
  constructor({bin}) {
    this.bin = bin;
  }

  config({accessKey, secretKey}) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['config', '--accesskey', accessKey, '--secretkey', secretKey, '--default-region', 'us-west-1'], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept();
        } else {
          reject(err);
        }
      });
    });
  }

  run({image, port}) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['run', '-d', '-p', `${port}:${port}`, image], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          const container = stdout.match(/^(\S+)/)[1];
          accept(container);
        } else {
          reject(err);
        }
      });
    });
  }

  start(container) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['start', container], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept();
        } else {
          reject(err);
        }
      });
    });
  }

  stop(container) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['stop', container], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept();
        } else {
          reject(err);
        }
      });
    });
  }

  rm(container) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['rm', '-f', container], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept();
        } else {
          reject(err);
        }
      });
    });
  }

  createLogStream(container, {tail = 'all'} = {}) {
    const s = new stream.PassThrough();
    s.destroy = () => {
      cp.kill();

      cp.stdout.unpipe(s);
      cp.stderr.unpipe(s);
    };

    const cp = childProcess.spawn(this.bin, ['logs', '-f', '--tail=' + tail, container], {
      encoding: 'utf8',
    }, (err, stdout, stderr) => {
      if (!err) {
        accept();
      } else {
        reject(err);
      }
    });
    cp.on('error', err => {
      s.emit('error', err);
    });
    cp.stdout.pipe(s);
    cp.stderr.pipe(s, {end: false});

    return s;
  }

  exec(container, cmd) {
    return pty.spawn(this.bin, ['exec', '-ti', container].concat(cmd));
  }

  ps({all = true} = {}) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['ps', '-q'].concat(all ? ['-a'] : []), {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept(stdout.split('\n').filter(container => container));
        } else {
          reject(err);
        }
      });
    });
  }

  inspect(containers) {
    if (!Array.isArray(containers)) {
      containers = [containers];
    }

    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['inspect'].concat(containers), {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept(JSON.parse(stdout));
        } else {
          reject(err);
        }
      });
    });
  }

  fipLs() {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['fip', 'ls', '--filter', 'dangling=true'], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          const lines = stdout.split('\n');
          const ips = lines.slice(1).map(s => {
            const match = s.match(/^(\S+)/);
            return match && match[1];
          }).filter(ip => ip);
          accept(ips);
        } else {
          reject(err);
        }
      });
    });
  }

  fipAttach(ip, container) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['fip', 'attach', ip, container], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept();
        } else {
          reject(err);
        }
      });
    });
  }

  running(container) {
    return new Promise((accept, reject) => {
      childProcess.execFile(this.bin, ['inspect', '-f', '{{.State.Running}}', container], {
        encoding: 'utf8',
      }, (err, stdout, stderr) => {
        if (!err) {
          accept(/^true\s*$/.test(stdout));
        } else {
          accept(false);
        }
      });
    });
  }
}

module.exports = ({bin = 'hyper'} = {}) => new Hyper({bin});
