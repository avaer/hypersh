const hyper = require('.');

const h = hyper({bin: '/tmp/hyper'});
h.run({
  image: 'modulesio/zeo',
  port: 8000,
})
  .then(container => {
    return h.fipLs()
      .then(ips => {
        return h.fipAttach(ips[0], container);
      });
  })
  .catch(err => {
    console.warn(err);
  });
