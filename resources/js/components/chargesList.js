import Alpine from 'alpinejs';

export default () => ({
  addChargeRow() {
    this.charges.push(
        {
          name: '',
          price: 0,
          percent: 0
        }
    );
  },
  removeChargeRow(index) {
    this.charges.splice(index, 1);
    // this.calculateSum();
    Alpine.$dispatch('charge-removed');
  }
});
