let balance = 0;
let income = 0;
let expense = 0;


function update(){

document.getElementById("balance").innerText =
balance.toLocaleString()+" تومان";

document.getElementById("income").innerText =
income.toLocaleString()+" تومان";

document.getElementById("expense").innerText =
expense.toLocaleString()+" تومان";

}


document.querySelector(".main-btn")
.onclick = function(){

let type = prompt(
"نوع تراکنش:\n1 درآمد\n2 خرج"
);


let amount = Number(
prompt("مبلغ را وارد کنید")
);


if(type==="1"){

income += amount;
balance += amount;

}

else if(type==="2"){

expense += amount;
balance -= amount;

}


update();

}


update();
