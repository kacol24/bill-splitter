document.addEventListener('alpine:init', () => {
  Alpine.data('BillSplitter', () => ({
    participants: this.$persist([
      {
        sum: 0
      }
    ]),
    addParticipantRow() {
      this.participants.push({
        sum: 0
      });
    },
    removeParticipantRow(index) {
      this.participants.splice(index, 1);
    },

    items: this.$persist([
      {
        price: 0
      }
    ]),
    get subtotal() {
      return _.sumBy(this.items,
          item => parseInt(item.price.toString().replaceAll(',', '')));
    },
    get grandtotal() {
      return this.subtotal;
    },
    addItemRow() {
      this.items.push({
        price: 0
      });
    },
    removeItemRow(index) {
      this.items.splice(index, 1);
    },
  }));
});
