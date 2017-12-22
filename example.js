const hyper = require('.');

const h = hyper({bin: '/tmp/hyper'});
h.run({
  image: 'modulesio/zeo',
  port: 8000,
})
  .then(container => {
    return h.fipLs()
      .then(ips => {
        return h.fipAttach(ips[0], container)
          .then(() => {
            return h.running(container)
              .then(running => {
                console.log('running', running);

                const cp = h.exec(container, ['bash']);
                cp.stdin.write('exit\n');
                cp.stdout.pipe(process.stdout);
                cp.on('exit', code => {
                  console.log('exit code', code);
                });
              });
          });
      });
  })
  .catch(err => {
    console.warn(err);
  });
