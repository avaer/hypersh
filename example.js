const hyper = require('.');

const h = hyper({bin: 'hyper'});
h.run({
  image: 'modulesio/zeo',
  port: 8000,
})
  .then(container => {
    console.log('container', container);

    return h.fipLs()
      .then(ips => {
        console.log('ips', ips);

        return h.fipAttach(ips[0], container)
          .then(() => {
            console.log('attached');

            return h.running(container)
              .then(running => {
                console.log('running', running);

                return h.ps({all: true})
                  .then(containers => {
                    console.log('containers', containers);

                    return h.inspect(containers)
                      .then(containerSpecs => {
                        console.log('container specs', containerSpecs);

                        const cp = h.exec(container, ['bash']);
                        cp.stdin.write('exit\n');
                        cp.stdout.pipe(process.stdout);
                        cp.on('exit', code => {
                          console.log('exit code', code);
                        });
                      });
                  });
              });
          });
      });
  })
  .catch(err => {
    console.warn(err);
  });
