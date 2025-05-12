# === Arithmetic & Logic ===
addi $t0, $zero, 10     # $t0 = 10
addi $t1, $zero, 20     # $t1 = 20
add  $t2, $t0, $t1      # $t2 = $t0 + $t1 = 30
sub  $t3, $t1, $t0      # $t3 = $t1 - $t0 = 10
and  $t4, $t0, $t1      # $t4 = 10 & 20
or   $t5, $t0, $t1      # $t5 = 10 | 20

# === Shifts ===
sll  $t6, $t0, 2        # $t6 = $t0 << 2 = 40
srl  $t7, $t1, 1        # $t7 = $t1 >> 1 = 10
sra  $s0, $t1, 1        # $s0 = 20 >> 1 = 10 (same as srl since pos num)

# === Memory ===
sw   $t2, 0($zero)      # store 30 at memory[0]
lw   $s1, 0($zero)      # load from memory[0] into $s1 → should be 30

# === Branches: true cases ===
beq  $t0, $t0, skip1    # branch taken
addi $s2, $zero, -1     # (should not run)
skip1:

bne  $t0, $t1, skip2    # branch taken
addi $s3, $zero, -1     # (should not run)
skip2:

blt  $t0, $t1, skip3    # 10 < 20 → true
addi $s4, $zero, -1     # (should not run)
skip3:

ble  $t0, $t1, skip4    # 10 <= 20 → true
addi $s5, $zero, -1     # (should not run)
skip4:

bgt  $t1, $t0, skip5    # 20 > 10 → true
addi $s6, $zero, -1     # (should not run)
skip5:

bge  $t1, $t0, skip6    # 20 >= 10 → true
addi $s7, $zero, -1     # (should not run)
skip6:

# === Jump + Link / Register ===
jal  label1             # should jump to label1 and store return addr in $ra
addi $a0, $zero, -1     # should not run

label1:
addi $a1, $zero, 99     # run after jal
jr   $ra                # jump back to after jal

addi $a2, $zero, 42     # should run after jr
