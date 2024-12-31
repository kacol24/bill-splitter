import Alpine from 'alpinejs';
import map from 'lodash/map';

export default () => ({
  addItemRow() {
    this.items.push({
      price: 0,
      participants: []
    });
    let ref = 'item-' + this.items.length;
    Alpine.$nextTick(() => {
      let inputEl = document.querySelectorAll('[x-ref="' + ref + '"]');
      inputEl[0].focus();
    });
    Alpine.$dispatch('item-added');
  },
  removeItemRow(index) {
    let confirmed = confirm('Remove item? Gak bisa di-undo ya');
    if (!confirmed) {
      return;
    }
    this.items.splice(index, 1);
    // this.calculateSum();
    // this.calculateTaxPercent();
    Alpine.$dispatch('item-removed');
  },
  toggleParticipants(index, checked) {
    if (checked) {
      this.items[index].participants = map(this.participants, 'id');
    } else {
      this.items[index].participants = [];
    }
    // this.calculateSum();
    Alpine.$dispatch('participant-toggled');
  },
  clearBill() {
    let confirmed = confirm('Clear bill? Gak bisa di-undo ya');
    if (!confirmed) {
      return;
    }
    this.items = [];
    this.charges = [];
    // this.calculateSum();
    Alpine.$dispatch('bill-cleared');
  }
});
