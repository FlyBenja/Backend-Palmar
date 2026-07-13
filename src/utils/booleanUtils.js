function convertirBooleano(valor) {
  return valor === true || valor === 'true' || valor === '1' || valor === 1;
}

module.exports = {
  convertirBooleano
};